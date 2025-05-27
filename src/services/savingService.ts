import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Saving {
  id: string;
  amount: number;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export class SavingService {
  private getSavingPath(userId: string) {
    if (!userId) throw new Error('User ID is required');
    return `monthly_tracker/${userId}/savings`;
  }

  private validateSaving(saving: Partial<Saving>) {
    if (typeof saving.amount !== 'number' || saving.amount < 0) {
      throw new Error('Invalid amount');
    }
    if (saving.date && isNaN(Date.parse(saving.date))) {
      throw new Error('Invalid date format');
    }
  }

  async getSaving(userId: string, savingId: string) {
    try {
      if (!savingId) throw new Error('Saving ID is required');
      
      const docRef = doc(db, this.getSavingPath(userId), savingId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Saving not found');
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Saving;
    } catch (error) {
      console.error('Error getting saving:', error);
      throw error;
    }
  }

  async addSaving(userId: string, saving: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      this.validateSaving(saving);
      
      const collectionRef = collection(db, this.getSavingPath(userId));
      const now = new Date().toISOString();
      
      const savingData = {
        amount: saving.amount,
        description: saving.description || '',
        date: saving.date || now.split('T')[0],
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collectionRef, savingData);
      return this.getSaving(userId, docRef.id);
    } catch (error) {
      console.error('Error adding saving:', error);
      throw error;
    }
  }

  async updateSaving(userId: string, savingId: string, saving: Partial<Saving>) {
    try {
      if (!savingId) throw new Error('Saving ID is required');
      this.validateSaving(saving);

      const docRef = doc(db, this.getSavingPath(userId), savingId);
      const updateData = {
        ...saving,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(docRef, updateData);
      return this.getSaving(userId, savingId);
    } catch (error) {
      console.error('Error updating saving:', error);
      throw error;
    }
  }

  async deleteSaving(userId: string, savingId: string) {
    try {
      if (!savingId) throw new Error('Saving ID is required');
      
      const docRef = doc(db, this.getSavingPath(userId), savingId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting saving:', error);
      throw error;
    }
  }

  async getAllSavings(userId: string) {
    try {
      const collectionRef = collection(db, this.getSavingPath(userId));
      const querySnapshot = await getDocs(collectionRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Saving[];
    } catch (error) {
      console.error('Error getting all savings:', error);
      throw error;
    }
  }
}

export const savingService = new SavingService();