import { useState } from 'react';
import { useTransactions, Transaction } from '../../contexts/TransactionContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../shared/Button';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, isValidCategory } from '../../utils/categories';
import { CategorySelect } from './CategorySelect';
import { useUserCurrency } from '../../hooks/useUserCurrency';
import { getCurrencySymbol } from '../../utils/currencyUtils';
import { useSettings } from '../../contexts/SettingsContext';

interface TransactionModalProps {
  transaction?: Transaction;
  onClose: () => void;
  type?: 'income' | 'expense';
}

type FormData = {
  description: string;
  amount: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
};

type FormField = 'description' | 'amount' | 'category' | 'date' | 'type';
type FormErrors = Partial<Record<FormField | 'submit', string>>;


// Add utility functions at the top
const getInitialAmount = (
  transaction: Transaction | undefined,
  userCurrency: string,
  exchangeRate: number
): string => {
  if (!transaction) return '';
  
  // For KHR transactions, use originalAmount
  if (transaction.originalCurrency === 'KHR' && userCurrency === 'KHR') {
    return Math.abs(transaction.originalAmount || 0).toString();
  }
  
  // For USD, convert if needed
  const amount = Math.abs(transaction.amount);
  return userCurrency === 'KHR' 
    ? Math.round(amount * exchangeRate).toString()
    : amount.toString();
};

export const TransactionModal = ({ transaction, onClose, type = 'expense' }: TransactionModalProps) => {
  const { addTransaction, updateTransaction } = useTransactions();
  const { user } = useAuth();
  const userCurrency = useUserCurrency();
  const { exchangeRates } = useSettings();
  
  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [convertedAmount, setConvertedAmount] = useState<string>('');

  // Initialize form data from transaction or defaults
  const [formData, setFormData] = useState<FormData>(() => ({
    description: transaction?.description || '',
    amount: getInitialAmount(transaction, userCurrency, exchangeRates.KHR_USD),
    category: transaction?.category || 
      (type === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id),
    type: transaction?.type || type,
    date: transaction?.date || new Date().toISOString().split('T')[0]
  }));

  /**
   * Validates the form data and returns any errors
   */
  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!isValidCategory(formData.category, formData.type)) {
      newErrors.category = 'Please select a valid category';
    }

    if (!formData.date || isNaN(new Date(formData.date).getTime())) {
      newErrors.date = 'Please select a valid date';
    }

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  /**
   * Handles form submission and transaction creation/update
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateForm();
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const amount = Math.abs(parseFloat(formData.amount)); // Ensure positive amount
      // Convert to USD if user currency is KHR
      const usdAmount = userCurrency === 'KHR' 
        ? amount / exchangeRates.KHR_USD 
        : amount;

      const transactionData = {
        description: formData.description.trim(),
        amount: usdAmount, // Always store positive amount
        category: formData.category,
        type: formData.type, // Use type field to determine if it's expense or income
        date: formData.date,
        ...(userCurrency === 'KHR' && {
          originalAmount: amount,
          originalCurrency: 'KHR',
          exchangeRate: exchangeRates.KHR_USD
        })
  // Attach creator info for multi-user setups
  , ...(user ? { createdBy: user.uid, createdByName: user.displayName || user.email || user.uid } : {})
      };

      if (transaction?.id) {
        await updateTransaction(transaction.id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      
      onClose();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles form field changes and updates converted amount for KHR currency
   */
  const handleChange = (field: FormField) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'amount' && userCurrency === 'KHR') {
        const numericAmount = parseFloat(value) || 0;
        const usdAmount = (numericAmount / exchangeRates.KHR_USD).toFixed(2);
        setConvertedAmount(usdAmount);
      } else if (field === 'type') {
        newData.category = (value === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0].id;
      }
      
      return newData;
    });
    
    // Clear field-specific error when value changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm z-50 
      flex items-center justify-center animate-fadeIn safe-area-inset-top safe-area-inset-bottom">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-[95vw] sm:max-w-md w-full mx-3 sm:mx-4 p-4 sm:p-6 
        animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {transaction ? 'Edit' : 'Add'} Transaction
          </h2>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="p-2 sm:p-3 min-h-[44px] min-w-[44px] touch-manipulation"
          >
            ×
          </Button>
        </div>

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Transaction Type */}
          {!transaction && (
            <div className="flex space-x-2 sm:space-x-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              {['income', 'expense'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleChange('type')({ 
                    target: { value: t } 
                  } as React.ChangeEvent<HTMLInputElement>)}
                  className={`flex-1 py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors min-h-[44px] touch-manipulation
                    ${formData.type === t 
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3 sm:space-y-4">
            {[
              { id: 'description' as const, label: 'Description', type: 'text' },
              { 
                id: 'amount' as const, 
                label: `Amount ${userCurrency === 'KHR' ? `(Rate: ${exchangeRates.KHR_USD} KHR/USD)` : ''}`,
                type: 'number', 
                step: userCurrency === 'KHR' ? '1' : '0.01',
                prefix: getCurrencySymbol(userCurrency),
                showConverted: userCurrency === 'KHR'
              },
              { id: 'date' as const, label: 'Date', type: 'date' }
            ].map(field => {
              // Separate DOM props from custom props
              const { showConverted, prefix, label, ...inputProps } = field;
              return (
                <div key={field.id} className="space-y-1 sm:space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                  </label>
                  <div className="relative">
                    {prefix && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        {prefix}
                      </span>
                    )}
                    <input
                      {...inputProps}
                      value={formData[field.id]}
                      onChange={handleChange(field.id)}
                      className={`block w-full px-3 py-2.5 sm:py-3 rounded-md border min-h-[44px] touch-manipulation
                        ${errors[field.id] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}
                        ${prefix ? 'pl-8 sm:pl-10' : ''}
                        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm
                        dark:bg-gray-700 dark:text-white`}
                    />
                  </div>
                  {showConverted && userCurrency === 'KHR' && formData.amount && (
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Amount in USD: {convertedAmount}
                    </div>
                  )}
                  {errors[field.id] && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1">{errors[field.id]}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Category Selection */}
          <CategorySelect
            categories={categories}
            value={formData.category}
            onChange={(value) => handleChange('category')({ 
              target: { value } 
            } as React.ChangeEvent<HTMLSelectElement>)}
            error={errors.category}
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 sm:space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="min-h-[44px] touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              className="min-h-[44px] touch-manipulation"
            >
              {transaction ? 'Update' : 'Add'} Transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
