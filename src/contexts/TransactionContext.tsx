import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { transactionService } from '../services/transactionService';
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext
import { useLoading } from './LoadingContext';
import { CategoryId } from '../utils/categories';
import { DeleteTransactionModal } from '../components/transaction/DeleteTransactionModal';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: CategoryId;
  type: 'income' | 'expense';
  date: string;
  createdAt?: string;
  updatedAt?: string;
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

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    showLoading();
    try {
      const data = await transactionService.getTransactions(user.uid);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load transactions'));
    } finally {
      hideLoading();
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    showLoading();
    try {
      const newTransaction = await transactionService.addTransaction(user.uid, transaction);
      setTransactions(prev => [newTransaction, ...prev].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      return newTransaction;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add transaction');
    } finally {
      hideLoading();
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    if (!user) throw new Error('User not authenticated');
    showLoading();
    try {
      await transactionService.updateTransaction(user.uid, id, transaction);
      setTransactions(prev =>
        prev.map(t => (t.id === id ? { ...t, ...transaction } : t))
      );
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update transaction');
    } finally {
      hideLoading();
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    showLoading();
    try {
      await transactionService.deleteTransaction(user.uid, id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
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
