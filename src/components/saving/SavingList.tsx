import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Saving } from '../../services/savingService';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import {
  TrashIcon,
  PencilIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { convertCurrency, formatUSD } from '../../utils/currencyUtils';

interface SavingListProps {
  savings: Saving[];
  isLoading?: boolean;
  itemsPerPage?: number;
  onDelete: (id: string) => void;
  onEdit: (saving: Saving) => void;
}

export const SavingList: React.FC<SavingListProps> = ({
  savings,
  isLoading = false,
  itemsPerPage = 10,
  onDelete,
  onEdit,
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Saving>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedSavings = useMemo(() => {
    return [...savings].sort((a, b) => {
      if (sortField === 'amount') {
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortField === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });
  }, [savings, sortField, sortDirection]);

  const paginatedSavings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedSavings.slice(start, end);
  }, [sortedSavings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(savings.length / itemsPerPage);

  const handleSort = (field: keyof Saving) => {
    if (sortField === field) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="large" className="text-indigo-600" />
      </div>
    );
  }

  if (!savings.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">{t('savings.noSavings')}</p>
        <p className="text-sm mt-2">{t('savings.addSavingPrompt')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('savings.date')}
                <button onClick={() => handleSort('date')} className="ml-2 inline-flex">
                  {sortField === 'date' && (sortDirection === 'asc' ? 
                    <ChevronUpIcon className="w-4 h-4" /> : 
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('savings.amount')}
                <button onClick={() => handleSort('amount')} className="ml-2 inline-flex">
                  {sortField === 'amount' && (sortDirection === 'asc' ? 
                    <ChevronUpIcon className="w-4 h-4" /> : 
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('savings.description')}
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">{t('common.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedSavings.map((saving) => (
              <tr key={saving.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(saving.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    {formatUSD(saving.amount)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {saving.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(saving)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(saving.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('common.previous')}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('common.next')}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('common.showing')} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> {t('common.to')}{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, savings.length)}</span> {t('common.of')}{' '}
                <span className="font-medium">{savings.length}</span> {t('common.results')}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};