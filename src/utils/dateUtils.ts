import { Transaction } from '../contexts/TransactionContext';

export const filterTransactionsByPeriod = (transactions: Transaction[], period: string): Transaction[] => {
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '3months':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1year':
      startDate.setFullYear(now.getFullYear(), 0, 1); // Start of current year
      break;
    case '1month':
      startDate.setMonth(now.getMonth(), 1); // Start of current month
      break;
    default:
      startDate.setMonth(now.getMonth() - 6);
  }
  
  return transactions.filter(transaction => 
    new Date(transaction.date) >= startDate && 
    new Date(transaction.date) <= now
  );
};
