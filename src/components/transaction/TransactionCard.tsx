import { useState, useMemo } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Transaction } from '../../contexts/TransactionContext';
import { getCategoryById } from '../../utils/categories';
import { CategoryIcon } from './CategoryIcon';
import { TransactionModal } from './TransactionModal';
import { useUserCurrency } from '../../hooks/useUserCurrency';
import { useSettings } from '../../contexts/SettingsContext';
import { getEditableAmount, calculateDisplayAmount } from '../../utils/currencyUtils';
import { useTransactions } from '../../contexts/TransactionContext';
import { ConfirmDialog } from '../ConfirmDialog';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface TransactionCardProps {
  transaction: Transaction;
  index: number;
}

interface AmountCalculation {
  displayAmount: number;
  showOriginal: boolean;
  originalAmount: number;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { deleteTransaction } = useTransactions();
  const userCurrency = useUserCurrency();
  const { exchangeRates } = useSettings();
  const category = getCategoryById(transaction.category, transaction.type);

  const { displayAmount, showOriginal, originalAmount } = useMemo<AmountCalculation>(() => {
    const result = calculateDisplayAmount(transaction, userCurrency, exchangeRates.KHR_USD);
    return {
      displayAmount: result.displayAmount,
      showOriginal: !!(transaction.originalCurrency && transaction.originalCurrency !== userCurrency),
      originalAmount: transaction.originalAmount || transaction.amount
    };
  }, [transaction, userCurrency, exchangeRates]);

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

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await deleteTransaction(transaction.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      setSwipeOffset(0);
    } finally {
      setIsDeleting(false);
    }
  };

  const initiateDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleEdit = () => {
    setSwipeOffset(0);
    setShowEditModal(true);
  };

  return (
    <div className="relative overflow-hidden rounded-lg mb-2 group">
      {/* Swipe Indicator */}
      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-gray-200 dark:from-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Action Buttons */}
      <div 
        className="absolute right-0 top-0 h-full flex items-center gap-2 pr-3 z-0"
        style={{
          opacity: Math.min(Math.abs(swipeOffset) / 75, 1),
          transform: `translateX(${Math.abs(swipeOffset) * 0.1}px)`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <button
          onClick={handleEdit}
          disabled={isDeleting}
          className="p-3 bg-blue-500 text-white rounded-full shadow-lg transform transition-all duration-200 
            hover:scale-105 hover:bg-blue-600 active:scale-95 disabled:opacity-50"
          style={{ transform: `scale(${Math.min(Math.abs(swipeOffset) / 150, 1)})` }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={initiateDelete}
          disabled={isDeleting}
          className="p-3 bg-red-500 text-white rounded-full shadow-lg transform transition-all duration-200 
            hover:scale-105 hover:bg-red-600 active:scale-95 disabled:opacity-50"
          style={{ transform: `scale(${Math.min(Math.abs(swipeOffset) / 150, 1)})` }}
        >
          {isDeleting ? (
            <LoadingSpinner size="small" className="text-white" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
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
        {/* Progress Indicator */}
        <div 
          className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-blue-500 to-red-500 origin-bottom transition-transform"
          style={{
            transform: `scaleY(${Math.min(Math.abs(swipeOffset) / 150, 1)})`,
          }}
        />
        
        <div className="p-3 flex items-center gap-3">
          <div className="flex-shrink-0">
            <CategoryIcon category={category}/>
          </div>
          
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="truncate">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                  {transaction.description || category.label}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(transaction.date).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex-shrink-0 text-right">
                <span className={`
                  text-sm font-medium
                  ${transaction.type === 'income' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'}
                `}>
                  {transaction.type === 'income' ? '+' : '-'}{' '}
                  {userCurrency === 'KHR' ? '៛' : '$'}
                  {new Intl.NumberFormat(undefined, {
                    minimumFractionDigits: userCurrency === 'KHR' ? 0 : 2,
                  }).format(Math.abs(displayAmount))}
                </span>
                {showOriginal && (
                  <span className="block text-xs text-gray-500">
                    {transaction.originalCurrency === 'KHR' ? '៛' : '$'}
                    {new Intl.NumberFormat(undefined, {
                      minimumFractionDigits: transaction.originalCurrency === 'KHR' ? 0 : 2,
                    }).format(Math.abs(originalAmount))}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showEditModal && (
        <TransactionModal
          transaction={{
            ...transaction,
            amount: getEditableAmount(transaction, userCurrency, exchangeRates.KHR_USD)
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        loading={isDeleting}
      />
    </div>
  );
};
