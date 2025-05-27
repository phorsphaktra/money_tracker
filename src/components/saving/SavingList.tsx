import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Saving } from '../../services/savingService';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import {
  TrashIcon,
  PencilIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { formatUSD } from '../../utils/currencyUtils';
import { ConfirmDialog } from '../ConfirmDialog';
import { SAVINGS_CATEGORIES } from '../../utils/savings';

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
  const [savingToDelete, setSavingToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = savings.reduce((sum, s) => sum + s.amount, 0);
    const credits = savings.filter(s => s.amount > 0).reduce((sum, s) => sum + s.amount, 0);
    const debits = savings.filter(s => s.amount < 0).reduce((sum, s) => sum + s.amount, 0);
    return { total, credits, debits };
  }, [savings]);

  // Filter savings based on search and category
  const filteredSavings = useMemo(() => {
    return savings.filter(saving => {
      const matchesSearch = saving.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatUSD(saving.amount).includes(searchTerm);
      const matchesCategory = !selectedCategory || saving.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [savings, searchTerm, selectedCategory]);

  const sortedSavings = useMemo(() => {
    return [...filteredSavings].sort((a, b) => {
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
  }, [filteredSavings, sortField, sortDirection]);

  const paginatedSavings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedSavings.slice(start, end);
  }, [sortedSavings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedSavings.length / itemsPerPage);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleSort = (field: keyof Saving) => {
    if (sortField === field) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteClick = (id: string) => {
    setSavingToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (savingToDelete) {
      onDelete(savingToDelete);
      setSavingToDelete(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, saving: Saving) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setFocusedRowIndex(Math.max(0, index - 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedRowIndex(Math.min(paginatedSavings.length - 1, index + 1));
        break;
      case 'Delete':
        e.preventDefault();
        handleDeleteClick(saving.id);
        break;
      case 'Enter':
        e.preventDefault();
        onEdit(saving);
        break;
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
    <div className="space-y-4">
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('savings.totalSavings')}</h3>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatUSD(summary.total)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('savings.totalCredits')}</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatUSD(summary.credits)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('savings.totalDebits')}</h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatUSD(summary.debits)}</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-800 dark:border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">{t('savings.allCategories')}</option>
            {SAVINGS_CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('common.no')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('date')}
                  className="group inline-flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span>{t('savings.date')}</span>
                  {sortField === 'date' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="w-4 h-4" /> : 
                      <ChevronDownIcon className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('amount')}
                  className="group inline-flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span>{t('savings.amount')}</span>
                  {sortField === 'amount' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="w-4 h-4" /> : 
                      <ChevronDownIcon className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('savings.description')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('savings.category')}
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">{t('common.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedSavings.map((saving, index) => {
              const category = SAVINGS_CATEGORIES.find(c => c.id === saving.categoryId);
              return (
                <tr 
                  key={saving.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${focusedRowIndex === index ? 'bg-gray-50 dark:bg-gray-800/75' : ''}`}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, index, saving)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {index + 1 + (currentPage - 1) * itemsPerPage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(saving.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {saving.amount > 0 ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-lg font-semibold ${
                        saving.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatUSD(Math.abs(saving.amount))}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {saving.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {category ? (
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${category.color}20`,
                          color: category.color 
                        }}
                      >
                        {category.label}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(saving)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                      aria-label={t('common.edit')}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(saving.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      aria-label={t('common.delete')}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous')}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('common.showing')} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> {t('common.to')}{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedSavings.length)}</span> {t('common.of')}{' '}
                <span className="font-medium">{sortedSavings.length}</span> {t('common.results')}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.first')}</span>
                  <ChevronDownIcon className="h-5 w-5 rotate-90" />
                </button>
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
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.last')}</span>
                  <ChevronUpIcon className="h-5 w-5 rotate-90" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {savingToDelete && (
        <ConfirmDialog
          isOpen={!!savingToDelete}
          onClose={() => setSavingToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={t('common.confirmDelete')}
          message={t('savings.confirmDeleteMessage')}
        />
      )}
    </div>
  );
};