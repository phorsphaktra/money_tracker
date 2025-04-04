import { useState } from 'react';
import { useTransactions, Transaction } from '../../contexts/TransactionContext';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface TransactionRowProps {
  transaction: Transaction;
  rowNumber: number;
}

export const TransactionRow = ({ transaction, rowNumber }: TransactionRowProps) => {
  const { deleteTransaction } = useTransactions();
  const [isLoading] = useState(false);

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Math.abs(transaction.amount));

  const formattedDate = new Date(transaction.date).toLocaleDateString();

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {rowNumber}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formattedDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {transaction.description}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
        {transaction.category}
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
      }`}>
        {transaction.type === 'income' ? '+' : '-'}{formattedAmount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {isLoading ? (
          <LoadingSpinner size="small" className="ml-auto" />
        ) : (
          <div className="flex justify-end space-x-2">
            <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
            <Button
              variant="secondary"
              onClick={() => deleteTransaction(transaction.id)}
              className="text-red-600 hover:text-red-900"
            >
              Delete
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
};
