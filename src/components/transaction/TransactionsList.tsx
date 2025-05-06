import { useState, useMemo } from 'react';
import { Transaction } from '../../contexts/TransactionContext';
import { getCategoryById } from '../../utils/categories';
import { CategoryIcon } from './CategoryIcon';
import { TransactionModal } from './TransactionModal';
import { useUserCurrency } from '../../hooks/useUserCurrency';
import { useSettings } from '../../contexts/SettingsContext';
import { getEditableAmount, calculateDisplayAmount } from '../../utils/currencyUtils';
import { useTransactions } from '../../contexts/TransactionContext';
import { TransactionActions } from './TransactionActions';
import { TransactionCard } from './TransactionCard';

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  limit?: number;
  showFilters?: boolean;
}

export const TransactionsList = ({ 
  transactions,
  isLoading,
  limit
}: TransactionsListProps) => {
  const displayTransactions = limit 
    ? transactions.slice(0, limit)
    : transactions;

  if (isLoading) {
    return <TransactionSkeleton />;
  }

  if (!transactions.length) {
    return <EmptyState />;
  }

  return (
    <div className="w-full mx-auto mb-auto">
      {/* Mobile View */}
      <div className="md:hidden space-y-2">
        <div className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 p-3 -mx-4">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Recent Transactions
          </h2>
        </div>
        <div className="space-y-2 px-4">
          {displayTransactions.map((transaction, index) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              index={index + 1}
            />
          ))}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">No.</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {displayTransactions.map((transaction, index) => (
                <TransactionItem 
                  key={transaction.id} 
                  transaction={transaction} 
                  index={index + 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TransactionItem = ({ 
  transaction, 
  index 
}: { 
  transaction: Transaction;
  index: number;
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { deleteTransaction } = useTransactions();
  const userCurrency = useUserCurrency();
  const { exchangeRates } = useSettings();
  const category = getCategoryById(transaction.category, transaction.type);

  const { displayAmount, showOriginal, originalAmount } = useMemo(() => {
    const result = calculateDisplayAmount(transaction, userCurrency, exchangeRates.KHR_USD);
    const shouldShowOriginal = 
      transaction.originalCurrency && 
      transaction.originalCurrency !== userCurrency;

    return {
      displayAmount: result.displayAmount,
      showOriginal: shouldShowOriginal,
      originalAmount: transaction.originalAmount || transaction.amount
    };
  }, [transaction, userCurrency, exchangeRates]);

  const handleEdit = () => setShowEditModal(true);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {index}
      </td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2 sm:gap-3">
          <CategoryIcon category={category} />
          <div className="sm:hidden flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
              {transaction.description || category.label}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(transaction.date).toLocaleDateString()}
            </span>
          </div>
          <span className="hidden sm:block text-sm text-gray-900 dark:text-gray-200">
            {category.label}
          </span>
        </div>
      </td>
      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 dark:text-gray-200">
          {transaction.description || category.label}
        </span>
      </td>
      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {new Date(transaction.date).toLocaleDateString()}
      </td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
        <div className="flex flex-col items-end">
          <span className={`text-sm font-medium ${
            transaction.type === 'income' 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {transaction.type === 'income' ? '+' : '-'}{' '}
            {userCurrency === 'KHR' ? '៛' : '$'}
            {new Intl.NumberFormat(undefined, {
              minimumFractionDigits: userCurrency === 'KHR' ? 0 : 2,
            }).format(Math.abs(displayAmount))}
          </span>
          {showOriginal && (
            <span className="text-xs text-gray-500">
              {transaction.originalCurrency === 'KHR' ? '៛' : '$'}
              {new Intl.NumberFormat(undefined, {
                minimumFractionDigits: transaction.originalCurrency === 'KHR' ? 0 : 2,
              }).format(Math.abs(originalAmount))}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
        <TransactionActions
          transaction={transaction}
          onDelete={() => deleteTransaction(transaction.id)}
          onEdit={handleEdit}
        />
      </td>
      {showEditModal && (
        <TransactionModal
          transaction={{
            ...transaction,
            amount: getEditableAmount(transaction, userCurrency, exchangeRates.KHR_USD)
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </tr>
  );
};

const TransactionSkeleton = () => (
  <>
    {/* Mobile Skeleton */}
    <div className="md:hidden space-y-3 px-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-600 rounded mt-2" />
              </div>
            </div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>

    {/* Desktop Skeleton */}
    <div className="hidden md:block">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 sm:px-6 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-8" />
                </th>
                {[...Array(5)].map((_, i) => (
                  <th key={i} className={`px-3 sm:px-6 py-3 ${i === 1 || i === 2 ? 'hidden sm:table-cell' : ''}`}>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className={`px-3 sm:px-6 py-4 ${j === 1 || j === 2 ? 'hidden sm:table-cell' : ''}`}>
                      <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
);

const EmptyState = () => (
  <div className="text-center py-8 text-gray-500 bg-white dark:bg-gray-900 rounded-lg">
    No transactions found
  </div>
);


