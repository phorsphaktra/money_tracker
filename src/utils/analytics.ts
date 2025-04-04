import { Transaction } from '../contexts/TransactionContext';

export const calculateTotalsByType = (transactions: Transaction[]) => {
  return transactions.reduce(
    (acc, curr) => {
      const amount = Math.abs(curr.amount);
      curr.type === 'income' ? (acc.income += amount) : (acc.expense += amount);
      return acc;
    },
    { income: 0, expense: 0 }
  );
};

export const getAvailableYears = (transactions: Transaction[]): number[] => {
  const years = transactions.map(t => new Date(t.date).getFullYear());
  return [...new Set(years)].sort((a, b) => b - a);
};

export const filterTransactionsByYear = (transactions: Transaction[], year: number) => {
  return transactions.filter(t => new Date(t.date).getFullYear() === year);
};

export const getMonthlyData = (transactions: Transaction[], year: number) => {
  const filtered = filterTransactionsByYear(transactions, year);
  const monthlyData = new Array(12).fill(0).map((_, i) => ({
    month: new Date(0, i).toLocaleString('default', { month: 'short' }),
    income: 0,
    expense: 0
  }));

  filtered.forEach(transaction => {
    const month = new Date(transaction.date).getMonth();
    const amount = Math.abs(transaction.amount);
    transaction.type === 'income' 
      ? (monthlyData[month].income += amount)
      : (monthlyData[month].expense += amount);
  });

  return monthlyData;
};

export const getCategoryTotals = (transactions: Transaction[]) => {
  return transactions.reduce((acc, curr) => {
    const category = curr.category;
    acc[category] = (acc[category] || 0) + Math.abs(curr.amount);
    return acc;
  }, {} as Record<string, number>);
};
