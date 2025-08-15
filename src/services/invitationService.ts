import { db } from '../config/firebase';
import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

export interface Invitation {
  id?: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted';
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


