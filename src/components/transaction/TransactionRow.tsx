import { useTransactions, Transaction } from '../../contexts/TransactionContext';
import { Button } from '../shared/Button';

interface TransactionRowProps {
  transaction: Transaction;
}

export const TransactionRow = ({ transaction }: TransactionRowProps) => {
  const { deleteTransaction } = useTransactions();
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(transaction.date).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {transaction.description}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {transaction.category}
        </span>
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
      }`}>
        {transaction.type === 'income' ? '+' : '-'}
        ${Math.abs(transaction.amount).toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Button
          variant="secondary"
          onClick={() => deleteTransaction(transaction.id)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </Button>
      </td>
    </tr>
  );
};
