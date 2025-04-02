import { createContext, useContext, useState, ReactNode } from 'react';

export interface Transaction {
  id: number;
  name: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  description: string;
}

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: number, updates: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: number) => void;
}

interface ValidationError {
  field: string;
  message: string;
}

const validateTransaction = (data: Partial<Transaction>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (data.amount !== undefined) {
    if (isNaN(data.amount)) {
      errors.push({ field: 'amount', message: 'Amount must be a valid number' });
    } else if (data.amount === 0) {
      errors.push({ field: 'amount', message: 'Amount cannot be zero' });
    }
  }

  if (data.description && data.description.trim().length < 3) {
    errors.push({ field: 'description', message: 'Description must be at least 3 characters' });
  }

  if (data.date && isNaN(Date.parse(data.date))) {
    errors.push({ field: 'date', message: 'Invalid date format' });
  }

  if (data.category && data.category.trim().length === 0) {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  return errors;
};

const TransactionsContext = createContext<TransactionsContextType | null>(null);

export const TransactionsProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    // ...existing mock transactions...
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...transaction, id: Date.now() }]);
  };

  const updateTransaction = async (id: number, updates: Partial<Transaction>) => {
    try {
      setIsLoading(true);
      setError(null);

      const validationErrors = validateTransaction(updates);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0].message);
      }

      const existingTransaction = transactions.find(t => t.id === id);
      if (!existingTransaction) {
        throw new Error('Transaction not found');
      }

      // Simulate API call with validation
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedTransaction = {
        ...existingTransaction,
        ...updates,
        amount: Math.abs(updates.amount || existingTransaction.amount) * 
                (updates.type || existingTransaction.type === 'expense' ? -1 : 1),
        date: updates.date || existingTransaction.date,
        modifiedAt: new Date().toISOString()
      };

      setTransactions(prev =>
        prev.map(t => t.id === id ? updatedTransaction : t)
      );

      return updatedTransaction;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update transaction';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = (id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <TransactionsContext.Provider value={{ transactions, addTransaction, updateTransaction, deleteTransaction }}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) throw new Error('useTransactions must be used within TransactionsProvider');
  return context;
};
