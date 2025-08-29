import { useState, useMemo, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
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
import { LoadingSpinner } from '../shared/LoadingSpinner';
// ...existing code...

/**
 * Props for the TransactionsList component
 * @interface TransactionsListProps
 * @property {Transaction[]} transactions - Array of transactions to display
 * @property {boolean} [isLoading] - Loading state of the transactions
 * @property {number} [limit] - Optional limit to display only N transactions
 * @property {boolean} [showFilters] - Whether to show filtering controls
 * @property {number} [itemsPerPage=10] - Number of items to show per page
 * @property {Date|null} [startDate] - Optional start date for filtering transactions
 * @property {Date|null} [endDate] - Optional end date for filtering transactions
 */
interface TransactionsListProps {
  transactions?: Transaction[];
  isLoading?: boolean;
  limit?: number;
  showFilters?: boolean;
  itemsPerPage?: number;
  startDate?: Date | null;
  endDate?: Date | null;
}

/**
 * Loading skeleton for the transactions list
 * Shows different layouts for mobile and desktop
 */
const TransactionSkeleton = () => (
  <>
    {/* Mobile Skeleton */}
    <div className="lg:hidden space-y-3 px-3 sm:px-4">
      <div className="flex justify-center py-6 sm:py-8">
        <LoadingSpinner size="large" className="text-primary" />
      </div>
    </div>

    {/* Desktop Skeleton */}
    <div className="hidden lg:flex justify-center py-8 sm:py-12">
      <LoadingSpinner size="large" className="text-primary" />
    </div>
  </>
);

/**
 * Empty state component shown when no transactions are available
 */
const EmptyState = () => (
  <div className="text-center py-6 sm:py-8 text-gray-500 bg-white dark:bg-gray-900 rounded-lg px-4">
    <div className="max-w-sm mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No transactions found</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or add a new transaction.</p>
    </div>
  </div>
);

/**
 * Renders a single transaction row item
 * @component
 * @param {Object} props - Component props
 * @param {Transaction} props.transaction - Transaction data to display
 * @param {number} props.index - Index number to display
 */
const TransactionItem = ({ 
  transaction, 
  index,
  canEdit
}: { 
  transaction: Transaction;
  index: number;
  canEdit?: boolean;
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
      <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        {index}
      </td>
      <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <CategoryIcon category={category} />
          <div className="sm:hidden flex flex-col min-w-0 flex-1">
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
              {transaction.description || category.label}
            </span>
            <div className="text-xs text-gray-500">
              <div>{new Date(transaction.date).toLocaleDateString()}</div>
              {transaction.createdAt && (
                <div className="text-xs text-gray-400">Created {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}</div>
              )}
              {transaction.createdByName && (
                <div className="text-xs text-gray-400 truncate">By {transaction.createdByName}</div>
              )}
            </div>
          </div>
          <span className="hidden sm:block text-sm text-gray-900 dark:text-gray-200 truncate">
            {category.label}
          </span>
        </div>
      </td>
      <td className="hidden sm:table-cell px-3 md:px-6 py-3 sm:py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 dark:text-gray-200 truncate max-w-[200px] block">
          {transaction.description || category.label}
        </span>
        {transaction.createdByName && (
          <div className="text-xs text-gray-500 mt-1">By {transaction.createdByName}</div>
        )}
      </td>
      <td className="hidden md:table-cell px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {new Date(transaction.date).toLocaleDateString()}
      </td>
      <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
        <div className="flex flex-col items-end">
          <span className={`text-xs sm:text-sm font-medium ${
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
      <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
        <TransactionActions
          transaction={transaction}
          onDelete={() => deleteTransaction(transaction.id)}
          onEdit={handleEdit}
          canEdit={canEdit}
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

/**
 * TransactionsList component displays a paginated list of transactions
 * with both mobile and desktop views.
 *
 * @component
 * @example
 * ```tsx
 * <TransactionsList
 *   transactions={transactions}
 *   isLoading={false}
 *   itemsPerPage={10}
 * />
 * ```
 */
export const TransactionsList = ({ 
  transactions,
  isLoading,
  limit,
  itemsPerPage = 10,
  startDate,
  endDate
}: TransactionsListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const txContext = useTransactions();
  const { activeOwnerId, canEditOwner } = txContext;
  const allTransactions = transactions ?? txContext.transactions;
  const [canEdit, setCanEdit] = useState<boolean | null>(null);
  
  // Reset pagination when underlying transactions change
  useEffect(() => {
    setCurrentPage(1);
  }, [allTransactions]);

  // Check edit permission for active owner and cache result for UI
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const allowed = await canEditOwner(activeOwnerId || undefined);
        if (mounted) setCanEdit(allowed);
      } catch (e) {
        if (mounted) setCanEdit(false);
      }
    })();
    return () => { mounted = false; };
  }, [activeOwnerId, canEditOwner]);

  /** 
   * Filter and paginate transactions
   */
  const paginatedTransactions = useMemo(() => {
    // First apply date filtering
    let filtered = [...allTransactions];
    // Sort by createdAt desc, fallback to date
    filtered.sort((a, b) => {
      const aKey = a.createdAt || a.date || '';
      const bKey = b.createdAt || b.date || '';
      return bKey.localeCompare(aKey);
    });
    if (startDate || endDate) {
      // clone date inputs to avoid mutating props
      const startOfDate = startDate ? new Date(startDate) : null;
      const endOfDate = endDate ? new Date(endDate) : null;
      if (startOfDate) startOfDate.setHours(0, 0, 0, 0);
      if (endOfDate) endOfDate.setHours(23, 59, 59, 999);

  filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        if (startOfDate && transactionDate < startOfDate) return false;
        if (endOfDate && transactionDate > endOfDate) return false;
        return true;
      });
    }

    // Then apply limit or pagination
    if (limit) return filtered.slice(0, limit);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [allTransactions, currentPage, itemsPerPage, limit, startDate, endDate]);

  // Calculate total pages based on filtered transactions
  const totalPages = Math.ceil(
    (startDate || endDate ? 
      allTransactions.filter(t => {
        const date = new Date(t.date);
        return (!startDate || date >= startDate) && 
               (!endDate || date <= endDate);
      }).length : 
      allTransactions.length) / itemsPerPage
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [allTransactions, startDate, endDate]);

  if (isLoading) {
    return <TransactionSkeleton />;
  }

  if (!allTransactions.length) {
    return <EmptyState />;
  }

  return (
    <div className="w-full mx-auto mb-auto">
      {canEdit === false && (
        <div className="px-3 sm:px-4 py-2 mb-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-200">
          You don't have permission to edit transactions for the selected owner. Switch owner or ask the owner to enable invited member edit permission.
        </div>
      )}
      {/* Mobile View */}
      <div className="lg:hidden space-y-2">
        <div className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 p-3 -mx-3 sm:-mx-4">
          <h2 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
            Recent Transactions
          </h2>
        </div>
        <div className="space-y-2 px-3 sm:px-4">
          {paginatedTransactions.map((transaction, index) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              index={(currentPage - 1) * itemsPerPage + index + 1}
              canEdit={canEdit === null ? undefined : canEdit}
            />
          ))}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {/* Add date range info if filtering */}
          {(startDate || endDate) && (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              Showing transactions from 
              {startDate ? ` ${startDate.toLocaleDateString()}` : ' the beginning'} 
              to
              {endDate ? ` ${endDate.toLocaleDateString()}` : ' now'}
            </div>
          )}

          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">No.</th>
                <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-2 sm:px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-2 sm:px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTransactions.map((transaction, index) => (
                <TransactionItem 
                  key={transaction.id} 
                  transaction={transaction} 
                  index={(currentPage - 1) * itemsPerPage + index + 1}
                  canEdit={canEdit === null ? undefined : canEdit}
                />
              ))}
            </tbody>
          </table>
          
          {/* Pagination Controls - Update display text to show filtered counts */}
          {!limit && totalPages > 1 && (
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  Showing{' '}
                  <span className="font-medium">
                    {Math.min(((currentPage - 1) * itemsPerPage) + 1, allTransactions.length)}
                  </span>
                  {' '}-{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, allTransactions.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{allTransactions.length}</span>
                  {' '}filtered results
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 
                    disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800
                    touch-manipulation min-h-[32px] sm:min-h-[36px]"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 
                    disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800
                    touch-manipulation min-h-[32px] sm:min-h-[36px]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


