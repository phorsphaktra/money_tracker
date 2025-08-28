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
import { SavingCard } from './SavingCard';

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
  const [selectedType, setSelectedType] = useState<'all' | 'credit' | 'debit'>('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Calculate summary statistics

  // Filter savings based on search, category, and type
  const filteredSavings = useMemo(() => {
    return savings.filter(saving => {
      const matchesSearch = saving.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatUSD(saving.amount).includes(searchTerm);
      const matchesCategory = !selectedCategory || saving.categoryId === selectedCategory;
      const matchesType = selectedType === 'all' || 
        (selectedType === 'credit' && saving.amount > 0) ||
        (selectedType === 'debit' && saving.amount < 0);
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [savings, searchTerm, selectedCategory, selectedType]);

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
  }, [searchTerm, selectedCategory, selectedType]);

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
      <div className="flex justify-center py-6 sm:py-8">
        <LoadingSpinner size="large" className="text-indigo-600" />
      </div>
    );
  }

  if (!savings.length) {
    return (
      <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400 px-4">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('savings.noSavings')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('savings.addSavingPrompt')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Mobile Filter Bar */}
      <div className="block lg:hidden">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 
                  dark:bg-gray-800 min-h-[44px] touch-manipulation"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 
                min-h-[44px] min-w-[44px] touch-manipulation"
            >
              <FunnelIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {isFiltersOpen && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <select
                className="px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 
                  bg-white dark:bg-gray-800 min-h-[44px] touch-manipulation"
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
              
              <select
                className="px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 
                  bg-white dark:bg-gray-800 min-h-[44px] touch-manipulation"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'all' | 'credit' | 'debit')}
              >
                <option value="all">{t('savings.allTransactions')}</option>
                <option value="credit">{t('savings.onlyCredits')}</option>
                <option value="debit">{t('savings.onlyDebits')}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Filters - Hidden on Mobile */}
      <div className="hidden lg:flex lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 sm:pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-800 dark:border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px] touch-manipulation"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Filters in a responsive grid */}
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-4">
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px] touch-manipulation"
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
          
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px] touch-manipulation"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'all' | 'credit' | 'debit')}
          >
            <option value="all">{t('savings.allTransactions')}</option>
            <option value="credit">{t('savings.onlyCredits')}</option>
            <option value="debit">{t('savings.onlyDebits')}</option>
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden">
        <div className="space-y-2">
          {paginatedSavings.map((saving) => (
            <SavingCard
              key={saving.id}
              saving={saving}
              onEdit={onEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('common.no')}
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button 
                        onClick={() => handleSort('date')}
                        className="group inline-flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation"
                      >
                        <span>{t('savings.date')}</span>
                        {sortField === 'date' && (
                          sortDirection === 'asc' ? 
                            <ChevronUpIcon className="w-4 h-4" /> : 
                            <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button 
                        onClick={() => handleSort('amount')}
                        className="group inline-flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation"
                      >
                        <span>{t('savings.amount')}</span>
                        {sortField === 'amount' && (
                          sortDirection === 'asc' ? 
                            <ChevronUpIcon className="w-4 h-4" /> : 
                            <ChevronDownIcon className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('savings.description')}
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('savings.category')}
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('savings.type')}
                    </th>
                    <th scope="col" className="relative px-3 sm:px-6 py-3">
                      <span className="sr-only">{t('common.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedSavings.map((saving, index) => {
                    const category = SAVINGS_CATEGORIES.find(c => c.id === saving.categoryId);
                    const isCredit = saving.type === 'credit';
                    return (
                      <tr 
                        key={saving.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${focusedRowIndex === index ? 'bg-gray-50 dark:bg-gray-800/75' : ''}`}
                        tabIndex={0}
                        onKeyDown={(e) => handleKeyDown(e, index, saving)}
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {index + 1 + (currentPage - 1) * itemsPerPage}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {new Date(saving.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {isCredit ? (
                              <ArrowUpIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`text-sm sm:text-lg font-semibold ${
                              isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {isCredit ? '+' : '-'}{formatUSD(Math.abs(saving.amount))}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                          <span className="text-sm text-gray-900 dark:text-gray-100 block truncate max-w-[200px]">
                            {saving.description || '-'}
                          </span>
                          {saving.createdByName && (
                            <div className="text-xs text-gray-500 mt-1">By {saving.createdByName}</div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                          {category ? (
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${category.color}20`,
                                color: category.color 
                              }}
                            >
                              {category.label}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            isCredit 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {isCredit ? t('savings.credit') : t('savings.debit')}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                          <button
                            onClick={() => onEdit(saving)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 sm:mr-4 p-1 touch-manipulation min-h-[32px] min-w-[32px]"
                            aria-label={t('common.edit')}
                          >
                            <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(saving.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 touch-manipulation min-h-[32px] min-w-[32px]"
                            aria-label={t('common.delete')}
                          >
                            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Pagination */}
      {totalPages > 1 && (
        <div className="px-3 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedSavings.length)} {t('common.of')} {sortedSavings.length}
          </p>
          
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 
                bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 
                disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            >
              {t('common.prev')}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 
                bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 
                disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {savingToDelete && (
        <ConfirmDialog
          isOpen={!!savingToDelete}
          onClose={() => setSavingToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={t('common.confirmDelete')}
          message={t('savings.confirmDeleteMessage')}
          confirmButtonClass="bg-red-500 hover:bg-red-600"
          // loading={handleDeleteClick}
        />
      )}
    </div>
  );
};