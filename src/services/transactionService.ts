import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { Transaction } from '../contexts/TransactionContext';

export class TransactionService {
  private getTransactionPath(userId: string) {
    return `monthly_tracker/${userId}/transactions`;
  }

  async getTransaction(userId: string, transactionId: string) {
    const docRef = doc(db, this.getTransactionPath(userId), transactionId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Transaction not found');
    }
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Transaction;
  }

  async addTransaction(userId: string, transaction: Omit<Transaction, 'id'>) {
    const collectionRef = collection(db, this.getTransactionPath(userId));
    const docRef = await addDoc(collectionRef, {
      ...transaction,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Fetch the complete transaction data after creation
    return this.getTransaction(userId, docRef.id);
  }

  async updateTransaction(userId: string, transactionId: string, transaction: Partial<Transaction>) {
    const docRef = doc(db, this.getTransactionPath(userId), transactionId);
    await updateDoc(docRef, {
      ...transaction,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const docRef = doc(db, this.getTransactionPath(userId), transactionId);
    await deleteDoc(docRef);
  }

  async getTransactions(userId: string) {
    const collectionRef = collection(db, this.getTransactionPath(userId));
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
  }
}

export const transactionService = new TransactionService();
