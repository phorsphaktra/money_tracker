import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, onSnapshot } from 'firebase/firestore';
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
    const now = new Date().toISOString();
    const docRef = await addDoc(collectionRef, {
      ...transaction,
      date: transaction.date || now.split('T')[0], // Use today as default date
      createdAt: now,
      updatedAt: now
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

  /**
   * Subscribe to realtime updates for a user's transactions.
   * Returns an unsubscribe function to stop listening.
   */
  subscribeToTransactions(userId: string, onChange: (transactions: Transaction[]) => void) {
    const collectionRef = collection(db, this.getTransactionPath(userId));
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      onChange(items);
    }, (error) => {
      console.error('subscribeToTransactions onSnapshot error:', error);
      // In case of error, surface an empty array (caller can handle errors separately)
      onChange([]);
    });

    return unsubscribe;
  }

  /**
   * Subscribe to realtime change events for a user's transactions.
   * Calls onChange with snapshot.docChanges() so callers can apply incremental updates.
   */
  subscribeToTransactionsChanges(userId: string, onChange: (changes: Array<{ type: 'added'|'modified'|'removed', doc: Transaction }>) => void) {
    const collectionRef = collection(db, this.getTransactionPath(userId));
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const changes = snapshot.docChanges().map(ch => ({
        type: ch.type as 'added'|'modified'|'removed',
        doc: ({ id: ch.doc.id, ...ch.doc.data() } as Transaction)
      }));
      onChange(changes);
    }, (error) => {
      console.error('subscribeToTransactionsChanges onSnapshot error:', error);
      onChange([]);
    });

    return unsubscribe;
  }
}

export const transactionService = new TransactionService();
