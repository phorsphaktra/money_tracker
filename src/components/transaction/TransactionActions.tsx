import React, { useState } from 'react';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Transaction } from '../../contexts/TransactionContext';
import { DeleteTransactionModal } from './DeleteTransactionModal';
import { useTranslation } from 'react-i18next';

interface TransactionActionsProps {
  transaction: Transaction;
  onDelete: (transaction: Transaction) => Promise<void>;
  onEdit?: (transaction: Transaction) => void;
}

export const TransactionActions: React.FC<TransactionActionsProps> = ({
  transaction,
  onDelete,
  onEdit
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
            onClick={() => onEdit(transaction)}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Edit transaction"
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </button>
        )}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete transaction"
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
