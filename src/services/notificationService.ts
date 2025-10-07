import { messaging, getToken, onMessage } from '../config/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface PushNotificationData {
  type: 'invitation' | 'invitation_accepted' | 'invitation_rejected' | 'uninvite';
  invitationId?: string;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  inviteeEmail?: string;
  message?: string;
}

export interface NotificationToken {
  userId: string;
  token: string;
  createdAt: any;
  updatedAt: any;
}

class NotificationService {
  private vapidKey: string;

  constructor() {
    this.vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
  }

  /**
   * Request permission and get FCM token
   */
  async requestPermission(): Promise<string | null> {
    if (!messaging) {
      console.warn('Firebase messaging not available');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: this.vapidKey,
        });
        
        if (token) {
          console.log('FCM token:', token);
          return token;
        }
      } else {
        console.warn('Notification permission denied');
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
    
    return null;
  }

  /**
   * Save FCM token to user document
   */
  async saveTokenToUser(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
        lastTokenUpdate: new Date()
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  /**
   * Remove FCM token from user document
   */
  async removeTokenFromUser(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(token)
      });
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }

  /**
   * Send push notification to specific user
   */
  async sendNotificationToUser(
    userId: string, 
    notification: {
      title: string;
      body: string;
      data?: PushNotificationData;
    }
  ): Promise<void> {
    try {
      // This would typically be done through a backend service
      // For now, we'll use a webhook approach similar to the email service
      const webhookUrl = import.meta.env.VITE_NOTIFICATION_WEBHOOK_URL;
      if (!webhookUrl) {
        console.warn('No notification webhook URL configured');
        return;
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'push_notification',
          userId,
          notification
        }),
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Send invitation notification
   */
  async sendInvitationNotification(
    inviteeEmail: string,
    ownerName: string,
    ownerEmail: string,
    invitationId: string
  ): Promise<void> {
    const notification = {
      title: 'New Invitation',
      body: `${ownerName || ownerEmail} invited you to collaborate on Money Tracker`,
      data: {
        type: 'invitation' as const,
        invitationId,
        ownerEmail,
        ownerName,
        inviteeEmail
      }
    };

    // Find user by email and send notification
    // This would typically be done through a backend service
    await this.sendNotificationToUserByEmail(inviteeEmail, notification);
  }

  /**
   * Send notification to user by email
   */
  async sendNotificationToUserByEmail(
    email: string,
    notification: {
      title: string;
      body: string;
      data?: PushNotificationData;
    }
  ): Promise<void> {
    try {
      const webhookUrl = import.meta.env.VITE_NOTIFICATION_WEBHOOK_URL;
      if (!webhookUrl) {
        console.warn('No notification webhook URL configured');
        return;
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'push_notification_by_email',
          email,
          notification
        }),
      });
    } catch (error) {
      console.error('Error sending push notification by email:', error);
    }
  }

  /**
   * Send invitation accepted notification to owner
   */
  async sendInvitationAcceptedNotification(
    ownerId: string,
    inviteeEmail: string,
    invitationId: string
  ): Promise<void> {
    const notification = {
      title: 'Invitation Accepted',
      body: `${inviteeEmail} accepted your invitation`,
      data: {
        type: 'invitation_accepted' as const,
        invitationId,
        inviteeEmail
      }
    };

    await this.sendNotificationToUser(ownerId, notification);
  }

  /**
   * Send invitation rejected notification to owner
   */
  async sendInvitationRejectedNotification(
    ownerId: string,
    inviteeEmail: string,
    invitationId: string
  ): Promise<void> {
    const notification = {
      title: 'Invitation Rejected',
      body: `${inviteeEmail} declined your invitation`,
      data: {
        type: 'invitation_rejected' as const,
        invitationId,
        inviteeEmail
      }
    };

    await this.sendNotificationToUser(ownerId, notification);
  }

  /**
   * Send uninvite notification to invitee
   */
  async sendUninviteNotification(
    inviteeEmail: string,
    ownerName: string,
    ownerEmail: string
  ): Promise<void> {
    const notification = {
      title: 'Invitation Cancelled',
      body: `${ownerName || ownerEmail} cancelled your invitation`,
      data: {
        type: 'uninvite' as const,
        ownerEmail,
        ownerName,
        inviteeEmail
      }
    };

    await this.sendNotificationToUserByEmail(inviteeEmail, notification);
  }

  /**
   * Listen for foreground messages
   */
  onForegroundMessage(callback: (payload: any) => void): () => void {
    if (!messaging) {
      return () => {};
    }

    const unsubscribe = onMessage(messaging, callback);
    return unsubscribe;
  }
}

export const notificationService = new NotificationService();
