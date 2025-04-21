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
      <div className="flex items-center gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(transaction)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <TrashIcon className="h-4 w-4" />
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
