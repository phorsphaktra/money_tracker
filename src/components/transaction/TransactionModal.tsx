import { useState } from 'react';
import { useTransactions, Transaction } from '../../contexts/TransactionContext';
import { Button } from '../shared/Button';

interface TransactionModalProps {
  transaction?: Transaction;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'food', label: 'Food & Dining' },
  { id: 'transport', label: 'Transportation' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'rent', label: 'Rent & Housing' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'income', label: 'Income' },
  { id: 'other', label: 'Other' }
];

export const TransactionModal = ({ transaction, onClose }: TransactionModalProps) => {
  const { addTransaction, updateTransaction } = useTransactions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: transaction?.name || '',
    description: transaction?.description || '',
    amount: transaction ? Math.abs(transaction.amount).toString() : '',
    category: transaction?.category || CATEGORIES[0].id,
    type: transaction?.type || 'expense',
    date: transaction?.date || new Date().toISOString().split('T')[0]
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const transactionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        amount: parseFloat(formData.amount) * (formData.type === 'expense' ? -1 : 1),
        category: formData.category,
        type: formData.type as 'income' | 'expense',
        date: formData.date
      };

      if (transaction) {
        await updateTransaction(transaction.id, transactionData);
      } else {
        const newTransaction = await addTransaction(transactionData);
        // You can do something with the newTransaction if needed
      }
      onClose();
    } catch (err) {
      setErrors({ 
        submit: err instanceof Error ? err.message : 'Failed to save transaction' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {transaction ? 'Edit' : 'Add'} Transaction
          </h2>
          <Button variant="outline" onClick={onClose}>×</Button>
        </div>

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div className="flex space-x-4 p-1 bg-gray-100 rounded-lg">
            {['income', 'expense'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type as 'income' | 'expense' }))}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
                  ${formData.type === type 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Form Fields */}
          {[
            { id: 'name', label: 'Name', type: 'text' },
            { id: 'description', label: 'Description', type: 'text' },
            { id: 'amount', label: 'Amount', type: 'number', step: '0.01' },
            { id: 'date', label: 'Date', type: 'date' }
          ].map(field => (
            <div key={field.id} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <input
                {...field}
                value={formData[field.id as keyof typeof formData]}
                onChange={handleChange(field.id as keyof typeof formData)}
                className={`block w-full px-3 py-2 rounded-md border 
                  ${errors[field.id] ? 'border-red-500' : 'border-gray-300'}
                  focus:ring-indigo-500 focus:border-indigo-500 shadow-sm`}
              />
              {errors[field.id] && (
                <p className="text-sm text-red-600 mt-1">{errors[field.id]}</p>
              )}
            </div>
          ))}

          {/* Category Selection */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={formData.category}
              onChange={handleChange('category')}
              className="block w-full px-3 py-2 rounded-md border border-gray-300
                focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            >
              {CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
            >
              {transaction ? 'Update' : 'Add'} Transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
