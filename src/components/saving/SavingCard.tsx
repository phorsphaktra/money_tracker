import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Saving } from '../../services/savingService';
import { useTranslation } from 'react-i18next';
import { formatUSD } from '../../utils/currencyUtils';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { SAVINGS_CATEGORIES } from '../../utils/savings';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface SavingCardProps {
  saving: Saving;
  onEdit: (saving: Saving) => void;
  onDelete: (id: string) => void;
}

export const SavingCard = ({ saving, onEdit, onDelete }: SavingCardProps) => {
  const { t } = useTranslation();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const category = SAVINGS_CATEGORIES.find(c => c.id === saving.categoryId);
  const isCredit = saving.type === 'credit';

  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (isDeleting) return;
      const newOffset = -Math.min(Math.max(-e.deltaX, 0), 150);
      setSwipeOffset(newOffset);
      if (Math.abs(newOffset) > 75) {
        window.navigator.vibrate?.(1);
      }
    },
    onSwipedLeft: () => {
      if (isDeleting) return;
      const threshold = -75;
      setSwipeOffset(swipeOffset <= threshold ? -150 : 0);
      if (swipeOffset <= threshold) {
        window.navigator.vibrate?.(3);
      }
    },
    onSwipedRight: () => {
      if (isDeleting) return;
      setSwipeOffset(0);
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    trackTouch: true,
    delta: 5,
  });

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(saving.id);
    } catch (error) {
      console.error('Failed to delete saving:', error);
      setSwipeOffset(0);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setSwipeOffset(0);
    onEdit(saving);
  };

  return (
    <div className="relative overflow-hidden rounded-lg mb-2 group">
      {/* Action Buttons */}
      <div 
        className="absolute right-0 top-0 h-full flex items-center gap-2 pr-2 sm:pr-3 z-0"
        style={{
          opacity: Math.min(Math.abs(swipeOffset) / 75, 1),
          transform: `translateX(${Math.abs(swipeOffset) * 0.1}px)`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <button
          onClick={handleEdit}
          disabled={isDeleting}
          className="p-2.5 sm:p-3 bg-blue-500 text-white rounded-full shadow-lg transform transition-all duration-200 
            hover:scale-105 hover:bg-blue-600 active:scale-95 disabled:opacity-50 touch-manipulation min-h-[44px] min-w-[44px]"
          style={{ transform: `scale(${Math.min(Math.abs(swipeOffset) / 150, 1)})` }}
        >
          <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2.5 sm:p-3 bg-red-500 text-white rounded-full shadow-lg transform transition-all duration-200 
            hover:scale-105 hover:bg-red-600 active:scale-95 disabled:opacity-50 touch-manipulation min-h-[44px] min-w-[44px]"
          style={{ transform: `scale(${Math.min(Math.abs(swipeOffset) / 150, 1)})` }}
        >
          {isDeleting ? (
            <LoadingSpinner size="small" className="text-white" />
          ) : (
            <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>

      {/* Card Content */}
      <div
        {...swipeHandlers}
        className={`
          bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 
          z-10 relative transform transition-all duration-200 touch-pan-y select-none
          ${isDeleting ? 'opacity-50' : ''}
          ${Math.abs(swipeOffset) > 0 ? 'shadow-md' : ''}
          ${Math.abs(swipeOffset) > 75 ? 'scale-98' : ''}
        `}
        style={{
          transform: `translateX(${swipeOffset}px) scale(${1 - Math.abs(swipeOffset) / 1000})`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {new Date(saving.date).toLocaleDateString()}
            </div>
            <div className={`flex items-center text-base sm:text-lg font-semibold ${
              isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isCredit ? (
                <ArrowUpIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              )}
              {isCredit ? '+' : '-'}{formatUSD(Math.abs(saving.amount))}
            </div>
          </div>

          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 truncate">
            {saving.description}
          </div>
          {saving.createdByName && (
            <p className="text-xs text-gray-400 truncate">By {saving.createdByName}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {category && (
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: `${category.color}20`,
                  color: category.color 
                }}
              >
                {category.label}
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              isCredit 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {isCredit ? t('savings.credit') : t('savings.debit')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
