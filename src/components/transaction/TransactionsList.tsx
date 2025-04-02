import { Transaction } from '../../contexts/TransactionContext';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../../utils/formatters';

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  limit?: number;
  showFilters?: boolean;
}

export const TransactionsList = ({ 
  transactions,
  isLoading,
  limit,
  showFilters = false
}: TransactionsListProps) => {
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
    <div className="space-y-4">
      {showFilters && <TransactionFilters />}
      {displayTransactions.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
};

const TransactionItem = ({ transaction }: { transaction: Transaction }) => (
  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 group cursor-pointer">
    <div className="flex items-center space-x-4">
      <CategoryIcon category={transaction.category} />
      <div>
        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
          {transaction.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{new Date(transaction.date).toLocaleDateString()}</span>
          {transaction.description && (
            <>
              <span>•</span>
              <span className="truncate max-w-[200px]">{transaction.description}</span>
            </>
          )}
        </div>
      </div>
    </div>
    <span className={`text-sm font-medium whitespace-nowrap ${
      transaction.type === 'income' 
        ? 'text-green-600 group-hover:text-green-700' 
        : 'text-red-600 group-hover:text-red-700'
    } transition-colors`}>
      {transaction.type === 'income' ? '+' : '-'}
      {formatCurrency(Math.abs(transaction.amount))}
    </span>
  </div>
);

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

const TransactionFilters = () => (
  <div className="flex gap-2 mb-4">
    <input
      type="text"
      placeholder="Search transactions..."
      className="px-3 py-2 border rounded-lg flex-1"
    />
  </div>
);
