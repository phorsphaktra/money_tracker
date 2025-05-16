import { Transaction } from '../contexts/TransactionContext';

type DateRange = {
  label: string;
  start: Date | null;
  end: Date | null;
};

const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return date;
};

export const getEndOfDay = (date: Date): Date => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const getStartOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const createDateRanges = (t: (key: string) => string): DateRange[] => {
  const today = getStartOfDay(new Date());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  return [
    { 
      label: t('transactions.dateRange.allTime'), 
      start: null, 
      end: null 
    },
    {
      label: t('transactions.dateRange.today'),
      start: today,
      end: getEndOfDay(today)
    },
    {
      label: t('transactions.dateRange.yesterday'),
      start: yesterday,
      end: getEndOfDay(yesterday)
    },
    {
      label: t('transactions.dateRange.thisWeek'),
      start: startOfWeek,
      end: getEndOfDay(today)
    },
    {
      label: t('transactions.dateRange.last7Days'),
      start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      end: getEndOfDay(today)
    },
    {
      label: t('transactions.dateRange.thisMonth'),
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: getEndOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0))
    },
    {
      label: t('transactions.dateRange.lastMonth'),
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: getEndOfDay(new Date(today.getFullYear(), today.getMonth(), 0))
    },
    {
      label: t('transactions.dateRange.custom'),
      start: null,
      end: null
    }
  ];
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
        return transactionDate >= getStartOfDay(startDate) && 
               transactionDate <= getEndOfDay(now);
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
