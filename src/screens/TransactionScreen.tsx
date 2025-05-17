import { useState } from 'react';
import { DateRangeSelect } from '../components/shared/DateRangeSelect';
import { useTransactions} from '../contexts/TransactionContext';
import { Button } from '../components/shared/Button';
import { TransactionModal } from '../components/transaction/TransactionModal';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { FloatingActionButton } from '../components/shared/FloatingActionButton';
import { TransactionsList } from '../components/transaction/TransactionsList';

export const TransactionsScreen = () => {
  const { transactions, isLoading, error } = useTransactions();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  const { t } = useTranslation();

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.type === filter;
    const matchesSearch = transaction.description.toLowerCase().includes(search.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(search.toLowerCase());
    
    // Add date filtering
    const transactionDate = new Date(transaction.date);
    const matchesDateRange = 
      (!dateRange.start || transactionDate >= dateRange.start) &&
      (!dateRange.end || transactionDate <= dateRange.end);

    return matchesFilter && matchesSearch && matchesDateRange;
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="large" className="text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t('transactions.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('transactions.subtitle')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:flex-1">
          <input
            type="text"
            placeholder={t('transactions.filters.search')}
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 
              focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DateRangeSelect
          startDate={dateRange.start}
          endDate={dateRange.end}
          onDateChange={(start, end) => setDateRange({ start, end })}
          className="w-full sm:w-56"
        />
        <div className="flex gap-2 overflow-x-auto py-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'primary' : 'secondary'}
              onClick={() => setFilter(type)}
              className="capitalize"
            >
              {t(`transactions.filters.${type}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* List Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <TransactionsList 
          transactions={filteredTransactions}
          isLoading={isLoading}
          showFilters={false}
          startDate={dateRange.start}
          endDate={dateRange.end}
        />
      </div>

      {/* FAB and Modal */}
      <FloatingActionButton 
        onClick={() => setIsAddingNew(true)} 
        label={t('transactions.actions.add')}
      />
      
      {isAddingNew && (
        <TransactionModal
          onClose={() => setIsAddingNew(false)}
        />
      )}
    </div>
  );
};
