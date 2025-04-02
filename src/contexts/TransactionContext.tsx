import React, { createContext, useContext, useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext
import { useLoading } from './LoadingContext';
import { CategoryId } from '../utils/categories';

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

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<Transaction>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { showLoading, hideLoading } = useLoading();

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

  return (
    <TransactionContext.Provider
      value={{ transactions, addTransaction, updateTransaction, deleteTransaction, isLoading, error }}
    >
      {children}
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
