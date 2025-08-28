import React, { useState } from 'react';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Transaction } from '../../contexts/TransactionContext';
import { DeleteTransactionModal } from './DeleteTransactionModal';
import { useTranslation } from 'react-i18next';

interface TransactionActionsProps {
  transaction: Transaction;
  onDelete: (transaction: Transaction) => Promise<void>;
  onEdit?: (transaction: Transaction) => void;
  // If explicitly false, actions will be disabled in the UI
  canEdit?: boolean;
}

export const TransactionActions: React.FC<TransactionActionsProps> = ({
  transaction,
  onDelete,
  onEdit
  , canEdit
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  useTranslation();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(transaction);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end space-x-1">
        {onEdit && (
          <button
            onClick={canEdit === false ? undefined : () => onEdit(transaction)}
            disabled={canEdit === false}
            className={`p-1.5 sm:p-2 text-gray-400 ${canEdit === false ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600 dark:hover:text-blue-400'} 
              rounded-lg ${canEdit === false ? '' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'} transition-colors
              touch-manipulation min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px]`}
            title={canEdit === false ? 'No permission to edit' : 'Edit transaction'}
            aria-disabled={canEdit === false}
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </button>
        )}
        <button
          onClick={canEdit === false ? undefined : () => setShowDeleteModal(true)}
          disabled={canEdit === false}
          className={`p-1.5 sm:p-2 text-gray-400 ${canEdit === false ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-600 dark:hover:text-red-400'} 
            rounded-lg ${canEdit === false ? '' : 'hover:bg-red-50 dark:hover:bg-red-900/20'} transition-colors
            touch-manipulation min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px]`}
          title={canEdit === false ? 'No permission to delete' : 'Delete transaction'}
          aria-disabled={canEdit === false}
        >
          <TrashIcon className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </button>
      </div>

      <DeleteTransactionModal
        transaction={transaction}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
};
