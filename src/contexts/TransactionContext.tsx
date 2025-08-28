import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { transactionService } from '../services/transactionService';
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext
import { useLoading } from './LoadingContext';
import { CategoryId } from '../utils/categories';
import { DeleteTransactionModal } from '../components/transaction/DeleteTransactionModal';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, limit, getDoc, doc } from 'firebase/firestore';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: CategoryId;
  type: 'income' | 'expense';
  date: string;
  createdAt?: string;
  updatedAt?: string;
  // Optional fields for multi-user setups: who created this record
  createdBy?: string; // uid or identifier
  createdByName?: string; // human-friendly name if stored
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRate?: number;
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  type?: 'income' | 'expense' | 'all';
  category?: CategoryId;
  search?: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<Transaction>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  sortBy: 'date' | 'amount' | 'category';
  setSortBy: (sort: 'date' | 'amount' | 'category') => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  filteredTransactions: Transaction[];
  deleteTransactionWithConfirmation: (transaction: Transaction) => void;
  transactionToDelete: Transaction | null;
  setTransactionToDelete: (transaction: Transaction | null) => void;
  loadTransactions: () => Promise<void>;
  // The currently selected owner whose transactions are loaded (could be another user if invited)
  activeOwnerId?: string | null;
  // Check whether the current authenticated user can edit transactions for the given owner
  canEditOwner: (ownerId?: string) => Promise<boolean>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null);
  const [canEditCache] = useState<Map<string, boolean>>(() => new Map());

  useEffect(() => {
    const init = async () => {
      if (!user) return;

      // Prefer invited-owner context first, then fallback to stored selection, then own data
      const invitedOwnerId = await findInvitingOwnerId(user.email || '');
      if (invitedOwnerId) {
        setActiveOwnerId(invitedOwnerId);
        localStorage.setItem('activeOwnerId', invitedOwnerId);
        await loadTransactions(invitedOwnerId);
        return;
      }

      const storedOwnerId = localStorage.getItem('activeOwnerId');
      const ownerToUse = storedOwnerId || user.uid;
      setActiveOwnerId(ownerToUse);
      await loadTransactions(ownerToUse);
    };
    init();
  }, [user]);

  const loadTransactions = async (ownerId?: string) => {
    if (!user) return;
    let targetOwnerId = ownerId || activeOwnerId || user.uid;
    showLoading();
    try {
      const data = await transactionService.getTransactions(targetOwnerId);
      setTransactions(data);
    } catch (err) {
      const isPermError = (err as any)?.code === 'permission-denied' || String(err).toLowerCase().includes('permission');
      if (isPermError && targetOwnerId !== user.uid) {
        // Fallback: switch to current user's own owner id and retry once
        console.warn('Permission denied for owner', targetOwnerId, '- falling back to current user', user.uid);
        setActiveOwnerId(user.uid);
        localStorage.setItem('activeOwnerId', user.uid);
        try {
          const retryData = await transactionService.getTransactions(user.uid);
          setTransactions(retryData);
          setError(new Error('Switched to your own account because you do not have permission to access the selected owner.'));
        } catch (retryErr) {
          const message = (retryErr as any)?.code === 'permission-denied' || String(retryErr).toLowerCase().includes('permission')
            ? new Error('Missing permissions to load your transactions. Please sign in with a different account or check Firestore rules.')
            : (retryErr instanceof Error ? retryErr : new Error('Failed to load transactions'));
          setError(message);
        }
      } else {
        const message = isPermError
          ? new Error('Missing permissions to load transactions for the selected owner. Check invited member settings or active owner selection.')
          : (err instanceof Error ? err : new Error('Failed to load transactions'));
        setError(message);
      }
    } finally {
      hideLoading();
    }
  };

  const findInvitingOwnerId = async (email: string): Promise<string | null> => {
    if (!email) return null;
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('preferences.invitedMembers', 'array-contains', email),
        where('preferences.allowMemberEditAllTransactions', '==', true),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].id;
      }
      return null;
    } catch (e) {
      console.error('Failed to find inviting owner:', e);
      return null;
    }
  };

  // Check whether the current user can edit transactions for ownerId.
  // Mirrors the Firestore security rule: owner OR invited member with allowMemberEditAllTransactions
  const canEditOwner = async (ownerId?: string) => {
    if (!user) return false;
    const target = ownerId || activeOwnerId || user.uid;
    if (user.uid === target) return true;

    // Cache check
    if (canEditCache.has(target)) return canEditCache.get(target) as boolean;

    try {
      const userDoc = await getDoc(doc(db, 'users', target));
      if (!userDoc.exists()) return false;
      const data = userDoc.data();
      const prefs = data.preferences || {};
      const allowed = !!(prefs.allowMemberEditAllTransactions === true && Array.isArray(prefs.invitedMembers) && prefs.invitedMembers.includes(user.email));
      canEditCache.set(target, allowed);
      return allowed;
    } catch (e) {
      console.error('Failed to check edit permission for owner', target, e);
      return false;
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    showLoading();
    try {
      const targetOwnerId = activeOwnerId || user.uid;
      const newTransaction = await transactionService.addTransaction(targetOwnerId, transaction);
      setTransactions(prev => [newTransaction, ...prev].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      return newTransaction;
    } catch (err) {
      // Map permission errors to clearer message
      if ((err as any)?.code === 'permission-denied' || String(err).toLowerCase().includes('permission')) {
        const e = new Error('Missing permissions to add transaction for the selected owner. Verify invited member permissions or switch active owner.');
        setError(e);
        throw e;
      }
      throw err instanceof Error ? err : new Error('Failed to add transaction');
    } finally {
      hideLoading();
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    if (!user) throw new Error('User not authenticated');
    showLoading();
    try {
      const targetOwnerId = activeOwnerId || user.uid;
      await transactionService.updateTransaction(targetOwnerId, id, transaction);
      setTransactions(prev =>
        prev.map(t => (t.id === id ? { ...t, ...transaction } : t))
      );
    } catch (err) {
      if ((err as any)?.code === 'permission-denied' || String(err).toLowerCase().includes('permission')) {
        const e = new Error('Missing permissions to update this transaction. Verify invited member permissions or switch active owner.');
        setError(e);
        throw e;
      }
      throw err instanceof Error ? err : new Error('Failed to update transaction');
    } finally {
      hideLoading();
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    showLoading();
    try {
      const targetOwnerId = activeOwnerId || user.uid;
      await transactionService.deleteTransaction(targetOwnerId, id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      if ((err as any)?.code === 'permission-denied' || String(err).toLowerCase().includes('permission')) {
        const e = new Error('Missing permissions to delete this transaction. Verify invited member permissions or switch active owner.');
        setError(e);
        throw e;
      }
      throw err instanceof Error ? err : new Error('Failed to delete transaction');
    } finally {
      hideLoading();
    }
  };

  const deleteTransactionWithConfirmation = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filters.search) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters.startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= filters.endDate!);
    }

    return filtered.sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'amount':
          return (a.amount - b.amount) * modifier;
        case 'category':
          return a.category.localeCompare(b.category) * modifier;
        default:
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * modifier;
      }
    });
  }, [transactions, filters, sortBy, sortDirection]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        filteredTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        isLoading,
        error,
        filters,
        setFilters,
        sortBy,
        setSortBy,
        sortDirection,
        setSortDirection,
        deleteTransactionWithConfirmation,
        transactionToDelete,
        setTransactionToDelete,
  loadTransactions,
  activeOwnerId,
  canEditOwner,
      }}
    >
      {children}
      {transactionToDelete && (
        <DeleteTransactionModal
          transaction={transactionToDelete}
          isOpen={!!transactionToDelete}
          onClose={() => setTransactionToDelete(null)}
          onConfirm={async () => {
            await deleteTransaction(transactionToDelete.id);
            setTransactionToDelete(null);
          }}
          isLoading={isLoading}
        />
      )}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
