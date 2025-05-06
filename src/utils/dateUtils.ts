import { Transaction } from '../contexts/TransactionContext';

const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return date;
};

const startOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const endOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

export const filterTransactionsByPeriod = (transactions: Transaction[], period: string): Transaction[] => {
  if (!transactions?.length) return [];
  
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '7days':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(now.getDate() - 30);
      break;
    case '3months':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1year':
      startDate.setFullYear(now.getFullYear(), 0, 1);
      break;
    case 'ytd':
      startDate.setFullYear(now.getFullYear(), 0, 1);
      break;
    case '1month':
    default:
      startDate.setDate(1);
      break;
  }

  return transactions
    .filter(transaction => {
      try {
        const transactionDate = parseDate(transaction.date);
        return transactionDate >= startOfDay(startDate) && 
               transactionDate <= endOfDay(now);
      } catch (error) {
        console.error('Invalid transaction date:', transaction.date);
        return false;
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getDateRangeLabel = (period: string): string => {  
  switch (period) {
    case '7days':
      return 'Last 7 Days';
    case '30days':
      return 'Last 30 Days';
    case '3months':
      return 'Last 3 Months';
    case '6months':
      return 'Last 6 Months';
    case '1year':
      return 'This Year';
    case 'ytd':
      return 'Year to Date';
    case '1month':
    default:
      return 'This Month';
  }
};

export const groupTransactionsByDate = (transactions: Transaction[]) => {
  return transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date);
    const key = date.toISOString().split('T')[0];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);
};
