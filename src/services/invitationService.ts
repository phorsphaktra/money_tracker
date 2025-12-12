import { db } from '../config/firebase';
import { addDoc, collection, doc, getDocs, getDoc, limit, query, serverTimestamp, updateDoc, where, arrayRemove } from 'firebase/firestore';

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
    await this.sendInviteEmail({ ...invite, id: ref.id, status: 'pending' });
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
    await updateDoc(ref, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    });
  },

  async rejectInvitation(invitationId: string) {
    const ref = doc(db, COLLECTION, invitationId);
    // Load the invitation to get ownerId and inviteeEmail so we can update owner's invitedMembers
    const snap = await getDoc(ref);
    const invitation = snap.exists() ? (snap.data() as Invitation) : null;

    await updateDoc(ref, {
      status: 'rejected',
      acceptedAt: null
    });

    // If we have the ownerId and inviteeEmail, remove the invitee from the owner's invitedMembers
    if (invitation && invitation.ownerId && invitation.inviteeEmail) {
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


