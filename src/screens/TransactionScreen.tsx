import { useState } from 'react';
import { useTransactions} from '../contexts/TransactionContext';
import { Button } from '../components/shared/Button';
import { TransactionRow } from '../components/transaction/TransactionRow';
import { TransactionModal } from '../components/transaction/TransactionModal';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { FloatingActionButton } from '../components/shared/FloatingActionButton';

export const TransactionsScreen = () => {
  const { transactions, isLoading, error } = useTransactions();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { t } = useTranslation();

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.type === filter;
    const matchesSearch = transaction.description.toLowerCase().includes(search.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
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
    <div className="space-y-6 pb-20"> {/* Added pb-20 to make room for FAB */}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('transactions.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('transactions.subtitle')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('transactions.filters.search')}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
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

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['no', 'date', 'description', 'category', 'amount', 'actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {t(`transactions.table.${header}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {isLoading ? (
                      <div className="flex justify-center items-center">
                        <LoadingSpinner size="small" className="text-indigo-600 mr-2" />
                        <span>Loading transactions...</span>
                      </div>
                    ) : (
                      'No transactions found'
                    )}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction, index) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    rowNumber={index + 1}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
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
