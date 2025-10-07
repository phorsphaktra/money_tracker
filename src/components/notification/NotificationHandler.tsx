import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { notificationService } from '../../services/notificationService';

interface NotificationHandlerProps {
  children: React.ReactNode;
}

export const NotificationHandler = ({ children }: NotificationHandlerProps) => {
  const { user } = useAuth();
  const { refreshInvites } = useNotifications();

  useEffect(() => {
    if (!user?.uid) return;

    // Request notification permission when user logs in
    const requestPermission = async () => {
      try {
        await notificationService.requestPermission();
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    };

    requestPermission();
  }, [user?.uid]);

  useEffect(() => {
    // Set up foreground message listener
    const unsubscribe = notificationService.onForegroundMessage((payload) => {
      console.log('Notification received:', payload);
      
      // Handle different notification types
      switch (payload.data?.type) {
        case 'invitation':
          // Refresh invites when new invitation is received
          refreshInvites();
          break;
        case 'invitation_accepted':
          // Handle invitation accepted notification
          console.log('Invitation accepted by:', payload.data.inviteeEmail);
          break;
        case 'invitation_rejected':
          // Handle invitation rejected notification
          console.log('Invitation rejected by:', payload.data.inviteeEmail);
          break;
        case 'uninvite':
          // Handle uninvite notification
          console.log('Invitation cancelled by:', payload.data.ownerEmail);
          refreshInvites();
          break;
        default:
          console.log('Unknown notification type:', payload.data?.type);
      }
    });

    return unsubscribe;
  }, [refreshInvites]);

  return <>{children}</>;
};
