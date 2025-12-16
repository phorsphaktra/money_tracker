import { db } from '../config/firebase';
import { addDoc, collection, doc, getDocs, getDoc, limit, query, serverTimestamp, updateDoc, where, arrayRemove } from 'firebase/firestore';

export interface Invitation {
  id?: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt?: any;
  acceptedAt?: any;
}

const COLLECTION = 'invitations';

/**
 * Helper to remove invitee from owner's invitedMembers array
 */
async function removeFromOwnerPreferences(ownerId: string, inviteeEmail: string) {
  try {
    const ownerRef = doc(db, 'users', ownerId);
    await updateDoc(ownerRef, {
      'preferences.invitedMembers': arrayRemove(inviteeEmail)
    });
  } catch (e) {
    // best-effort: log but don't fail
    console.warn('Failed to remove invited member from owner preferences', e);
  }
}

export const invitationService = {
  /**
   * Create a new invitation
   */
  async createInvitation(invite: Omit<Invitation, 'id' | 'status' | 'createdAt' | 'acceptedAt'>) {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...invite,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    const invitationData: Invitation = { ...invite, id: ref.id, status: 'pending' };
    await this.sendInviteEmail(invitationData);
    return ref.id;
  },

  /**
   * Get an invitation by ID
   */
  async getInvitationById(invitationId: string): Promise<Invitation | null> {
    const ref = doc(db, COLLECTION, invitationId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Invitation) };
  },

  /**
   * Get all pending invitations for an invitee email
   */
  async getPendingInvitationsForEmail(email: string): Promise<Invitation[]> {
    const q = query(
      collection(db, COLLECTION),
      where('inviteeEmail', '==', email.toLowerCase()),
      where('status', '==', 'pending'),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Invitation) }));
  },

  /**
   * Get all accepted invitations for an invitee email (groups they belong to)
   */
  async getAcceptedInvitationsForEmail(email: string): Promise<Invitation[]> {
    const q = query(
      collection(db, COLLECTION),
      where('inviteeEmail', '==', email.toLowerCase()),
      where('status', '==', 'accepted'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Invitation) }));
  },

  /**
   * Get all invitations sent by an owner (all statuses)
   */
  async getInvitationsByOwner(ownerId: string): Promise<Invitation[]> {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', ownerId),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Invitation) }));
  },

  /**
   * Get pending invitations for a specific email sent by owner
   */
  async getPendingInvitationByOwnerAndEmail(ownerId: string, inviteeEmail: string): Promise<Invitation | null> {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', ownerId),
      where('inviteeEmail', '==', inviteeEmail.toLowerCase()),
      where('status', '==', 'pending'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...(doc.data() as Invitation) };
  },

  /**
   * Accept an invitation
   * Returns the invitation data before acceptance for context switching
   */
  async acceptInvitation(invitationId: string): Promise<Invitation> {
    // Get invitation before updating to return it for context switching
    const invitation = await this.getInvitationById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    if (invitation.status !== 'pending') {
      throw new Error(`Cannot accept invitation with status: ${invitation.status}`);
    }

    const ref = doc(db, COLLECTION, invitationId);
    await updateDoc(ref, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    });

    return { ...invitation, status: 'accepted' };
  },

  /**
   * Reject an invitation
   */
  async rejectInvitation(invitationId: string): Promise<void> {
    const invitation = await this.getInvitationById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    if (invitation.status !== 'pending') {
      throw new Error(`Cannot reject invitation with status: ${invitation.status}`);
    }

    const ref = doc(db, COLLECTION, invitationId);
    await updateDoc(ref, {
      status: 'rejected',
      acceptedAt: null
    });

    // Remove from owner's invitedMembers
    if (invitation.ownerId && invitation.inviteeEmail) {
      await removeFromOwnerPreferences(invitation.ownerId, invitation.inviteeEmail);
    }
  },

  /**
   * Cancel a pending invitation (called by owner)
   */
  async cancelInvitation(invitationId: string, ownerId: string): Promise<void> {
    const invitation = await this.getInvitationById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    if (invitation.ownerId !== ownerId) {
      throw new Error('Only the invitation owner can cancel invitations');
    }
    if (invitation.status !== 'pending') {
      throw new Error(`Cannot cancel invitation with status: ${invitation.status}`);
    }

    const ref = doc(db, COLLECTION, invitationId);
    await updateDoc(ref, {
      status: 'cancelled',
    });

    // Remove from owner's invitedMembers
    if (invitation.inviteeEmail) {
      await removeFromOwnerPreferences(ownerId, invitation.inviteeEmail);
    }
  },

  /**
   * Cancel all pending invitations for a specific email (used when removing member)
   */
  async cancelInvitationsByEmail(ownerId: string, inviteeEmail: string): Promise<void> {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', ownerId),
      where('inviteeEmail', '==', inviteeEmail.toLowerCase()),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    
    const promises = snap.docs.map(async (docSnapshot) => {
      await updateDoc(docSnapshot.ref, { status: 'cancelled' });
    });
    
    await Promise.all(promises);
  },

  /**
   * Send invite email via webhook
   */
  async sendInviteEmail(invite: Invitation): Promise<void> {
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


