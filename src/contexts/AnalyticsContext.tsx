import React, { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { useTransactions, Transaction } from './TransactionContext';
import { useSaving, Saving } from './SavingContext';
import { CategoryId, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  netBalance: number;
}

interface CategoryBreakdown {
  category: CategoryId;
  label: string;
  amount: number;
  percentage: number;
  count: number;
}

interface FinancialSuggestion {
  type: 'warning' | 'info' | 'success';
  message: string;
  action?: string;
}

interface SavingsSummary {
  credits: number;
  debits: number;
  creditCount: number;
  debitCount: number;
}

interface AnalyticsState {
  selectedYear: number;
  filteredData: {
    transactions: Transaction[];
    savings: Saving[];
  };
  yearIncome: number;
  yearExpenses: number;
  yearSavings: number;
  netBalance: number;
  monthlyBurnRate: number;
  monthlyData: MonthlyData[];
  expenseCategories: CategoryBreakdown[];
  incomeCategories: CategoryBreakdown[];
  suggestions: FinancialSuggestion[];
  savingsSummary: SavingsSummary;
  isLoading: boolean;
  error: Error | null;
  isRefetching: boolean;
}

interface AnalyticsContextType extends AnalyticsState {
  setSelectedYear: (year: number) => void;
  refetchData: () => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { transactions, isLoading: transactionsLoading, error: transactionsError } = useTransactions();
  const { state: savingState, loadSavings } = useSaving();
  const [selectedYear, setSelectedYear] = React.useState(() => {
    const savedYear = localStorage.getItem('analyticsYear');
    return savedYear ? parseInt(savedYear, 10) : new Date().getFullYear();
  });
  const [isRefetching, setIsRefetching] = React.useState(false);

  // Save selected year to localStorage
  useEffect(() => {
    localStorage.setItem('analyticsYear', selectedYear.toString());
  }, [selectedYear]);

  const refetchData = useCallback(async () => {
    setIsRefetching(true);
    try {
      await Promise.all([
        loadSavings()
      ]);
    } catch (error) {
      console.error('Error refetching analytics data:', error);
    } finally {
      setIsRefetching(false);
    }
  }, [loadSavings]);

  const filteredData = useMemo(() => {
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31);

    const yearTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= yearStart && date <= yearEnd;
    });

    const yearSavings = savingState.savings.filter(s => {
      const date = new Date(s.date);
      return date >= yearStart && date <= yearEnd;
    });

    return {
      transactions: yearTransactions,
      savings: yearSavings
    };
  }, [transactions, savingState.savings, selectedYear]);

  const yearIncome = useMemo(() => 
    filteredData.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    [filteredData.transactions]
  );

  const yearExpenses = useMemo(() => 
    filteredData.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [filteredData.transactions]
  );

  const yearSavings = useMemo(() => 
    filteredData.savings
      .filter(s => s.type === 'credit')
      .reduce((sum, s) => sum + s.amount, 0),
    [filteredData.savings]
  );

  const netBalance = useMemo(() => 
    yearIncome - yearExpenses,
    [yearIncome, yearExpenses]
  );

  const monthlyBurnRate = useMemo(() => 
    yearExpenses / 12,
    [yearExpenses]
  );

  const savingsSummary = useMemo(() => {
    const credits = filteredData.savings
      .filter(s => s.type === 'credit')
      .reduce((sum, s) => sum + s.amount, 0);

    const debits = filteredData.savings
      .filter(s => s.type === 'debit')
      .reduce((sum, s) => sum + s.amount, 0);

    const creditCount = filteredData.savings
      .filter(s => s.type === 'credit')
      .length;

    const debitCount = filteredData.savings
      .filter(s => s.type === 'debit')
      .length;

    return {
      credits,
      debits,
      creditCount,
      debitCount
    };
  }, [filteredData.savings]);

  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(selectedYear, i, 1);
      return date.toLocaleString('default', { month: 'short' });
    });

    return months.map((month, index) => {
      const monthTransactions = filteredData.transactions.filter(t => 
        new Date(t.date).getMonth() === index
      );

      const monthSavings = filteredData.savings.filter(s => 
        new Date(s.date).getMonth() === index
      );

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const savings = monthSavings
        .filter(s => s.type === 'credit')
        .reduce((sum, s) => sum + s.amount, 0);

      return {
        month,
        income,
        expenses,
        savings,
        netBalance: income - expenses
      };
    });
  }, [filteredData, selectedYear]);

  const expenseCategories = useMemo(() => {
    const categoryMap = filteredData.transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        if (!curr.category) return acc;
        if (!acc[curr.category]) {
          acc[curr.category] = { amount: 0, count: 0 };
        }
        acc[curr.category].amount += Math.abs(curr.amount);
        acc[curr.category].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

    const totalAmount = Object.values(categoryMap)
      .reduce((sum, { amount }) => sum + amount, 0);

    return Object.entries(categoryMap)
      .map(([id, data]) => ({
        category: id as CategoryId,
        label: EXPENSE_CATEGORIES.find(c => c.id === id)?.label || id,
        amount: data.amount,
        percentage: (data.amount / totalAmount) * 100,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredData.transactions]);

  const incomeCategories = useMemo(() => {
    const categoryMap = filteredData.transactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => {
        if (!curr.category) return acc;
        if (!acc[curr.category]) {
          acc[curr.category] = { amount: 0, count: 0 };
        }
        acc[curr.category].amount += curr.amount;
        acc[curr.category].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

    const totalAmount = Object.values(categoryMap)
      .reduce((sum, { amount }) => sum + amount, 0);

    return Object.entries(categoryMap)
      .map(([id, data]) => ({
        category: id as CategoryId,
        label: INCOME_CATEGORIES.find(c => c.id === id)?.label || id,
        amount: data.amount,
        percentage: (data.amount / totalAmount) * 100,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredData.transactions]);

  const suggestions = useMemo(() => {
    const tips: FinancialSuggestion[] = [];

    // Check if expenses exceed income
    if (yearExpenses > yearIncome) {
      tips.push({
        type: 'warning',
        message: 'Your expenses exceed your income this year.',
        action: 'Consider reducing discretionary spending.'
      });
    }

    // Check savings rate
    const savingsRate = (yearSavings / yearIncome) * 100;
    if (savingsRate < 20) {
      tips.push({
        type: 'info',
        message: `Your savings rate is ${savingsRate.toFixed(1)}%.`,
        action: 'Aim for at least 20% of your income.'
      });
    }

    // Identify top spending category
    if (expenseCategories.length > 0) {
      const topCategory = expenseCategories[0];
      tips.push({
        type: 'info',
        message: `Your highest spending is on ${topCategory.label} (${topCategory.percentage.toFixed(1)}%).`,
        action: 'Review if this aligns with your priorities.'
      });
    }

    // Project yearly savings
    const projectedSavings = yearSavings * (12 / new Date().getMonth());
    tips.push({
      type: 'success',
      message: `You're on track to save ${projectedSavings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} this year.`
    });

    return tips;
  }, [yearExpenses, yearIncome, yearSavings, expenseCategories]);

  const value = {
    selectedYear,
    setSelectedYear,
    filteredData,
    yearIncome,
    yearExpenses,
    yearSavings,
    netBalance,
    monthlyBurnRate,
    monthlyData,
    expenseCategories,
    incomeCategories,
    suggestions,
    savingsSummary,
    isLoading: transactionsLoading || savingState.isLoading,
    error: transactionsError,
    isRefetching,
    refetchData
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}; 