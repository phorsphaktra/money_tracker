import { db, auth } from '../config/firebase';
import { addDoc, collection, doc, getDocs, getDoc, limit, query, serverTimestamp, updateDoc, where, arrayRemove, deleteDoc } from 'firebase/firestore';
import { notificationService } from './notificationService';
import { memberService } from './memberService';

export interface Invitation {
  id?: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: any;
  acceptedAt?: any;
}

const COLLECTION = 'invitations';

export const invitationService = {
  async createInvitation(invite: Omit<Invitation, 'id' | 'status' | 'createdAt' | 'acceptedAt'>) {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...invite,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    
    const invitation = { ...invite, id: ref.id, status: 'pending' as const };
    
    // Send email notification
    await this.sendInviteEmail(invitation);
    
    // Send push notification
    await notificationService.sendInvitationNotification(
      invite.inviteeEmail,
      invite.ownerName || invite.ownerEmail || 'Unknown',
      invite.ownerEmail || '',
      ref.id
    );

    // Create pending member stub in owner's group for immediate switching UX
    try {
      await memberService.addPendingMemberByEmail(invite.ownerId, invite.inviteeEmail, invitation.ownerName);
    } catch (e) {
      console.warn('Failed to add pending member stub:', e);
    }
    
    return ref.id;
  },

  async getPendingInvitationsForEmail(email: string) {
    const q = query(
      collection(db, COLLECTION),
      where('inviteeEmail', '==', email),
      where('status', '==', 'pending'),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Invitation) }));
  },

  async acceptInvitation(invitationId: string) {
    const ref = doc(db, COLLECTION, invitationId);
    
    // Get invitation data before updating
    const snap = await getDoc(ref);
    const invitation = snap.exists() ? (snap.data() as Invitation) : null;
    
    await updateDoc(ref, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    });
    
    // Send notification to owner about acceptance
    if (invitation && invitation.ownerId && invitation.inviteeEmail) {
      await notificationService.sendInvitationAcceptedNotification(
        invitation.ownerId,
        invitation.inviteeEmail,
        invitationId
      );
    }

    // Add the accepted member to the member group
    if (invitation && invitation.ownerId && invitation.inviteeEmail) {
      try {
        // Build invitee profile from the authenticated user (correct UID)
        const currentUser = auth.currentUser;
        if (currentUser) {
          const inviteeProfile = {
            uid: currentUser.uid,
            email: currentUser.email || invitation.inviteeEmail,
            displayName: currentUser.displayName || currentUser.email || 'Unknown User',
            photoURL: (currentUser.photoURL as any) || null,
          } as any;

          await memberService.addMemberToGroup(invitation.ownerId, inviteeProfile);
        }
      } catch (error) {
        console.warn('Failed to add member to group after acceptance:', error);
        // Don't fail the acceptance if member group update fails
      }
    }
    
    // Return invitation data so callers can act on ownerId
    return invitation;
  },

  async rejectInvitation(invitationId: string) {
    const ref = doc(db, COLLECTION, invitationId);
    // Load the invitation to get ownerId and inviteeEmail so we can update owner's invitedMembers
    const snap = await getDoc(ref);
    const invitation = snap.exists() ? (snap.data() as Invitation) : null;

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Update invitation status to rejected
    await updateDoc(ref, {
      status: 'rejected',
      acceptedAt: null,
      rejectedAt: serverTimestamp()
    });

    // Send notification to owner about rejection
    if (invitation.ownerId && invitation.inviteeEmail) {
      await notificationService.sendInvitationRejectedNotification(
        invitation.ownerId,
        invitation.inviteeEmail,
        invitationId
      );
    }

    // Clean up data: remove the invitee from the owner's invitedMembers
    if (invitation.ownerId && invitation.inviteeEmail) {
      try {
        const ownerRef = doc(db, 'users', invitation.ownerId);
        await updateDoc(ownerRef, {
          'preferences.invitedMembers': arrayRemove(invitation.inviteeEmail)
        });
      } catch (e) {
        // best-effort: log but don't fail the rejection
        console.warn('Failed to remove invited member from owner preferences', e);
      }
    }

    // Optional: Delete the invitation document after a delay to keep database clean
    // This could be done with a cloud function or scheduled task
    setTimeout(async () => {
      try {
        await deleteDoc(ref);
        console.log('Cleaned up rejected invitation:', invitationId);
      } catch (e) {
        console.warn('Failed to clean up rejected invitation:', e);
      }
    }, 24 * 60 * 60 * 1000); // Delete after 24 hours
  },

  async uninviteMember(ownerId: string, inviteeEmail: string) {
    try {
      // Find pending invitation for this email
      const q = query(
        collection(db, COLLECTION),
        where('ownerId', '==', ownerId),
        where('inviteeEmail', '==', inviteeEmail),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        throw new Error('No pending invitation found for this email');
      }

      // Get the invitation data
      const invitationDoc = snap.docs[0];
      const invitation = invitationDoc.data() as Invitation;
      
      // Delete the invitation
      await deleteDoc(invitationDoc.ref);
      
      // Remove from owner's invitedMembers list
      const ownerRef = doc(db, 'users', ownerId);
      await updateDoc(ownerRef, {
        'preferences.invitedMembers': arrayRemove(inviteeEmail)
      });
      
      // Send uninvite notification to invitee
      await notificationService.sendUninviteNotification(
        inviteeEmail,
        invitation.ownerName || invitation.ownerEmail || 'Unknown',
        invitation.ownerEmail || ''
      );
      
      return true;
    } catch (error) {
      console.error('Error uninviting member:', error);
      throw error;
    }
  },

  async getInvitationsByOwner(ownerId: string) {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', ownerId),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Invitation) }));
  },

  async sendInviteEmail(invite: Invitation) {
    try {
      const webhookUrl = import.meta.env.VITE_INVITE_WEBHOOK_URL as string | undefined;
      if (!webhookUrl) return; // No email provider configured
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invite',
          data: invite,
        }),
      });
    } catch (e) {
      console.warn('Invite email webhook failed:', e);
    }
  },
};


