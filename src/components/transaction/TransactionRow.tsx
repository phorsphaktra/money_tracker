import { useState } from 'react';
import { useTransactions, Transaction } from '../../contexts/TransactionContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { DeleteTransactionModal } from './DeleteTransactionModal';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { TransactionModal } from './TransactionModal';

interface TransactionRowProps {
  transaction: Transaction;
  rowNumber: number;
}

export const TransactionRow = ({ transaction, rowNumber }: TransactionRowProps) => {
  const { deleteTransaction } = useTransactions();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteTransaction(transaction.id);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Math.abs(transaction.amount));

  const formattedDate = new Date(transaction.date).toLocaleDateString();

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {rowNumber}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formattedDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {transaction.description}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {transaction.category}
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
      }`}>
        {transaction.type === 'income' ? '+' : '-'}{formattedAmount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {isLoading ? (
          <LoadingSpinner size="small" className="ml-auto" />
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
              title="Edit transaction"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete transaction"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {showEditModal && (
          <TransactionModal
            transaction={transaction}
            onClose={() => setShowEditModal(false)}
          />
        )}

        <DeleteTransactionModal
          transaction={transaction}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isLoading={isLoading}
        />
      </td>
    </tr>
  );
};
