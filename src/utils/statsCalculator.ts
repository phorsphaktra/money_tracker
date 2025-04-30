import { Transaction } from '../contexts/TransactionContext';

interface PeriodStats {
  income: number;
  spending: number;
  savingsRate: number;
}

export interface DashboardStats {
  totalBalance: number;
  currentSpending: number;
  currentIncome: number;
  savingsRate: string;
  incomeTrend: string;
  spendingTrend: string;
  savingsTrend: string;
  balanceTrend: string;
}

export const calculatePeriodStats = (transactions: Transaction[]): PeriodStats => {
  const income = transactions
    .filter(txn => txn.type === 'income')
    .reduce((sum, txn) => sum + txn.amount, 0);
  
  const spending = transactions
    .filter(txn => txn.type === 'expense')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const savingsRate = income > 0 ? ((income + spending) / income * 100) : 0;

  return { income, spending, savingsRate };
};

export const calculateDashboardStats = (transactions: Transaction[]): DashboardStats => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthTxns = transactions.filter(txn => {
    const date = new Date(txn.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const lastMonthTxns = transactions.filter(txn => {
    const date = new Date(txn.date);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  });

  const currentStats = calculatePeriodStats(currentMonthTxns);
  const lastStats = calculatePeriodStats(lastMonthTxns);

  const calculateTrend = (current: number, last: number): string => 
    last ? ((current - last) / last * 100).toFixed(1) : '0';

  const totalBalance = transactions.reduce((sum, txn) => 
    txn.type === 'income' ? sum + txn.amount : sum - txn.amount, 0);

  return {
    totalBalance,
    currentSpending: currentStats.spending,
    currentIncome: currentStats.income,
    savingsRate: currentStats.savingsRate.toFixed(1),
    incomeTrend: calculateTrend(currentStats.income, lastStats.income),
    spendingTrend: calculateTrend(currentStats.spending, lastStats.spending),
    savingsTrend: calculateTrend(currentStats.savingsRate, lastStats.savingsRate),
    balanceTrend: calculateTrend(currentStats.income, lastStats.income)
  };
};
