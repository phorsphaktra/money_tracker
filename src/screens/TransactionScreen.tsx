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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 font-medium mb-2">{error.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!transactions || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <LoadingSpinner size="large" className="text-indigo-600" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header with Stats */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 shadow-lg">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {t('transactions.title')}
            </h1>
            <p className="text-indigo-100 text-sm md:text-base">
              {t('transactions.subtitle')}
            </p>
        </div>

        {/* Filters Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search */}
            <div className="lg:col-span-5">
              <input
                type="text"
                placeholder={t('transactions.filters.search')}
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  dark:bg-gray-800 dark:border-gray-700 transition-all duration-200
                  hover:border-indigo-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {/* Date Range */}
            <div className="lg:col-span-3">
              <DateRangeSelect
                startDate={dateRange.start}
                endDate={dateRange.end}
                onDateChange={(start, end) => setDateRange({ start, end })}
                className="w-full"
              />
            </div>

            {/* Filter Buttons */}
            <div className="lg:col-span-4 flex items-center gap-2">
              {(['all', 'income', 'expense'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? 'primary' : 'secondary'}
                  onClick={() => setFilter(type)}
                  className={`flex-1 justify-center capitalize transition-all duration-200
                    ${filter === type ? 'shadow-lg shadow-indigo-500/30' : ''}
                  `}
                >
                  {t(`transactions.filters.${type}`)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* List Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <TransactionsList 
            transactions={filteredTransactions}
            isLoading={isLoading}
            showFilters={false}
            startDate={dateRange.start}
            endDate={dateRange.end}
          />
        </div>

        {/* FAB */}
        <FloatingActionButton 
          onClick={() => setIsAddingNew(true)} 
          label={t('transactions.actions.add')}
        />
        
        {/* Modal */}
        {isAddingNew && (
          <TransactionModal
            onClose={() => setIsAddingNew(false)}
          />
        )}
      </div>
    </div>
  );
};
