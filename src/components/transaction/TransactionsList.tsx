import { useState, useMemo } from 'react';
import { Transaction } from '../../contexts/TransactionContext';
import { getCategoryById } from '../../utils/categories';
import { formatCurrency } from '../../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { TransactionModal } from './TransactionModal';
import { useUserCurrency } from '../../hooks/useUserCurrency';
import { useSettings } from '../../contexts/SettingsContext';
import { getEditableAmount } from '../../utils/currencyUtils';

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  limit?: number;
  showFilters?: boolean;
}

export const TransactionsList = ({ 
  transactions,
  isLoading,
  limit}: TransactionsListProps) => {
  const displayTransactions = limit 
    ? transactions.slice(0, limit)
    : transactions;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <TransactionSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return <EmptyState />;
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {displayTransactions.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
};

const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const userCurrency = useUserCurrency();
  const { exchangeRates } = useSettings();
  const category = getCategoryById(transaction.category, transaction.type);

  const displayAmount = useMemo(() => {
    if (transaction.originalCurrency === 'KHR' && userCurrency === 'KHR') {
      return transaction.originalAmount || transaction.amount;
    }
    if (userCurrency === 'KHR' && transaction.originalCurrency !== 'KHR') {
      return Math.round(transaction.amount * exchangeRates.KHR_USD);
    }
    if (userCurrency === 'USD' && transaction.originalCurrency === 'KHR') {
      return transaction.amount;
    }
    return Math.abs(transaction.amount);
  }, [transaction, userCurrency, exchangeRates]);

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 
      dark:hover:bg-gray-700/50 transition-colors duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0">
          <CategoryIcon category={category} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {transaction.description || category.label}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{new Date(transaction.date).toLocaleDateString()}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{category.label}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end ml-3">
        <span className={`text-sm font-medium whitespace-nowrap ${
          transaction.type === 'income' 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(displayAmount, userCurrency)}
        </span>
        {transaction.originalCurrency && transaction.originalCurrency !== userCurrency && (
          <span className="text-xs text-gray-500">
            {formatCurrency(
              Math.abs(transaction.originalAmount || transaction.amount), 
              transaction.originalCurrency
            )}
          </span>
        )}
        <div className="flex gap-2 mt-1">
          <button 
            className="text-xs text-blue-600 dark:text-blue-400">
            Edit
          </button>
          <button className="text-xs text-red-600 dark:text-red-400">Delete</button>
        </div>
      </div>

      {showEditModal && (
        <TransactionModal
          transaction={{
            ...transaction,
            amount: getEditableAmount(transaction, userCurrency, exchangeRates.KHR_USD)
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

const TransactionSkeleton = () => (
  <div className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
    <div className="w-10 h-10 bg-gray-200 rounded-full" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
    <div className="h-4 bg-gray-200 rounded w-20" />
  </div>
);

const EmptyState = () => (
  <div className="text-center py-8 text-gray-500">
    No transactions found
  </div>
);


