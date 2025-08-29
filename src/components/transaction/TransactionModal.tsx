import { useEffect, useRef, useState } from 'react';
import { useTransactions, Transaction } from '../../contexts/TransactionContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../shared/Button';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, isValidCategory } from '../../utils/categories';
// CategorySelect replaced with a native <select> for simpler mobile UX
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

  const amountRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Autofocus amount input for quick entry when creating a new transaction
    if (!transaction && amountRef.current) {
      amountRef.current.focus();
    }
  }, [transaction]);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4 safe-area-inset-top safe-area-inset-bottom">
      <div className="w-full max-w-[95vw] sm:max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col">
          {/* Header: drag handle + title + close */}
          <div className="px-4 pt-3 pb-2 sm:pt-4 sm:pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-center">
              <div className="w-12 h-0.5 bg-gray-300 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {transaction ? 'Edit' : 'Add'} Transaction
                </h3>
                <p className="text-xs text-gray-500">Quick entry — optimized for mobile</p>
              </div>
              <Button variant="outline" onClick={onClose} className="p-2 rounded-md">
                <span className="sr-only">Close</span>
                ×
              </Button>
            </div>
          </div>

          <div className="px-4 pb-4 sm:px-6 sm:pb-6 overflow-y-auto">
            {errors.submit && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded">
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Transaction Type toggle */}
              {!transaction && (
                <div className="flex space-x-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg">
                  {['income', 'expense'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleChange('type')({ target: { value: t } } as React.ChangeEvent<HTMLInputElement>)}
                      className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors text-center focus:ring-2 focus:ring-indigo-500
                        ${formData.type === t ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              )}

              {/* Inputs */}
              <div className="space-y-3">
        <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <input
          // keep autoFocus off here for numeric quick entry; amount will be focused
                    value={formData.description}
                    onChange={handleChange('description')}
                    placeholder="e.g., Coffee with client"
                    className={`mt-1 block w-full px-4 py-3 rounded-lg border shadow-sm text-base
                      ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} dark:bg-gray-800 dark:text-white`}
                  />
                  {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                  <div className="mt-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">{getCurrencySymbol(userCurrency)}</span>
                    <input
                      inputMode="decimal"
                      value={formData.amount}
                      onChange={handleChange('amount')}
                      placeholder={userCurrency === 'KHR' ? '1000' : '0.00'}
                      ref={amountRef}
                      className={`block w-full pl-10 pr-4 py-3 rounded-lg border text-base
                        ${errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} dark:bg-gray-800 dark:text-white`}
                    />
                  </div>
                  {userCurrency === 'KHR' && formData.amount && (
                    <div className="text-xs text-gray-500 mt-1">≈ ${convertedAmount} USD</div>
                  )}
                  {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                    <select
                      value={formData.category}
                      onChange={handleChange('category')}
                      className={`mt-1 block w-full px-4 py-3 rounded-lg border text-base
                        ${errors.category ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} dark:bg-gray-800 dark:text-white`}
                    >
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id} className="text-gray-900">
                          {c.title || c.name || c.label || c.id}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={handleChange('date')}
                      className={`mt-1 block w-full px-4 py-3 rounded-lg border shadow-sm text-base
                        ${errors.date ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} dark:bg-gray-800 dark:text-white`}
                    />
                    {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
                  </div>
                </div>
              </div>
              {/* Action bar inside form for accessibility */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={onClose} className="flex-1 py-3 rounded-lg">Cancel</Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                    className="flex-1 py-3 rounded-lg"
                  >
                    {transaction ? 'Update' : 'Add'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
