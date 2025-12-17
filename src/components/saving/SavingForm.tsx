import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import { Button } from '../shared/Button';
import { XMarkIcon, CalendarIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { getSavingsCategories, SavingsGroup } from '../../utils/savings';

interface SavingFormProps {
  amount?: string;
  description?: string;
  selectedDate?: Date;
  onSubmit: (saving: {
    amount: number;
    description: string;
    date: string;
    categoryId?: string;
    type: 'credit' | 'debit';
  }) => Promise<void>;
  onCancel: () => void;
  onAmountChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  onDateChange?: (date: Date) => void;
  isSubmitting?: boolean;
}

// Add custom input component for the date picker
const CustomDateInput = React.forwardRef<HTMLDivElement, { value?: string; onClick?: () => void }>(
  ({ value, onClick }, ref) => (
    <div className="relative group" ref={ref}>
      <div
        className="w-full px-3 pl-9 py-1.5 rounded-xl border border-gray-300 
          focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent
          dark:border-gray-700 hover:border-indigo-300 
          transition-all duration-200 cursor-pointer
          dark:bg-gray-800 min-h-[36px] touch-manipulation"
        onClick={onClick}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <CalendarIcon className="h-4 w-4 text-gray-400 group-hover:text-indigo-500" />
        </div>
        <input
          value={value}
          className="w-full bg-transparent outline-none cursor-pointer text-sm"
          readOnly
          placeholder="Select date"
        />
      </div>
    </div>
  )
);

CustomDateInput.displayName = 'CustomDateInput';

export const SavingForm: React.FC<SavingFormProps> = ({
  amount: initialAmount = '',
  description: initialDescription = '',
  selectedDate: initialDate = new Date(),
  onSubmit,
  onCancel,
  onAmountChange: externalAmountChange,
  onDescriptionChange: externalDescriptionChange,
  onDateChange: externalDateChange,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(initialAmount);
  const [description, setDescription] = useState(initialDescription);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');
  const [savingsGroup, setSavingsGroup] = useState<SavingsGroup>('regular');
  const [formError, setFormError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // autofocus amount for faster entry on mobile/desktop when form mounts
    const timer = setTimeout(() => amountRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, []);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    externalAmountChange?.(value);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    externalDescriptionChange?.(value);
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      externalDateChange?.(date);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        const next = prev.filter((id) => id !== categoryId);
        return next.length === 0 ? ['__auto__'] : next;
      }
      return [...prev.filter((id) => id !== '__auto__'), categoryId];
    });
  };

  const toggleAutoAllocate = () => {
    setSelectedCategories(['__auto__']);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setFormError(null);
    if (!amount || isNaN(parseFloat(amount))) {
      setFormError(t('savings.invalidAmount') || 'Please enter a valid amount');
      amountRef.current?.focus();
      return;
    }

    try {
      const finalAmount = parseFloat(amount);
      const effectiveCategories = selectedCategories.filter((id) => id !== '__auto__');

      if (effectiveCategories.length === 0) {
        // Auto allocate across defaults
        await onSubmit({
          amount: Math.abs(finalAmount),
          description: description.trim(),
          date: selectedDate.toISOString(),
          categoryId: undefined,
          type: transactionType
        });
      } else {
        const splitAmount = Math.abs(finalAmount) / effectiveCategories.length;
        for (const categoryId of effectiveCategories) {
          await onSubmit({
            amount: splitAmount,
            description: description.trim(),
            date: selectedDate.toISOString(),
            categoryId,
            type: transactionType
          });
        }
      }
      // the parent screen will show success flash / reset; clear any local error
      setFormError(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormError((error as any)?.message || t('savings.saveError') || 'Failed to save');
    }
  };

  return (
    <div className="relative">
      {/* Close button for mobile */}
      <button
        type="button"
        onClick={onCancel}
        className="absolute -top-2 -right-2 p-2 rounded-full bg-gray-100 
          dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
          transition-colors duration-200 md:hidden min-h-[44px] min-w-[44px] touch-manipulation"
      >
        <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>

      <form onSubmit={handleFormSubmit} className="space-y-2 sm:space-y-3">
        {/* Title */}
        <div className="text-center mb-1 sm:mb-2">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {t('savings.add_new')}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {t('savings.form_subtitle')}
          </p>
        </div>

        {/* Transaction Type */}
        <div className="grid grid-cols-2 gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setTransactionType('credit')}
            className={`flex items-center justify-center gap-2 px-2 sm:px-3 py-1.5 sm:py-1.5 rounded-xl border 
              transition-all duration-200 min-h-[44px] touch-manipulation ${transactionType === 'credit'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-400'
              }`}
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm">{t('savings.credit')}</span>
          </button>
          <button
            type="button"
            onClick={() => setTransactionType('debit')}
            className={`flex items-center justify-center gap-2 px-2 sm:px-3 py-1.5 sm:py-1.5 rounded-xl border 
              transition-all duration-200 min-h-[44px] touch-manipulation ${transactionType === 'debit'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-400'
              }`}
          >
            <MinusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm">{t('savings.debit')}</span>
          </button>
        </div>

        {/* Savings Group */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => { setSavingsGroup('regular'); setSelectedCategories(['__auto__']); }}
            className={`flex items-center justify-center px-2 sm:px-3 py-1.5 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation ${savingsGroup === 'regular'
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400'
            }`}
          >
            <span className="text-sm">Regular</span>
          </button>
          <button
            type="button"
            onClick={() => { setSavingsGroup('goal'); setSelectedCategories(['__auto__']); }}
            className={`flex items-center justify-center px-2 sm:px-3 py-1.5 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation ${savingsGroup === 'goal'
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400'
            }`}
          >
            <span className="text-sm">Goal</span>
          </button>
          <button
            type="button"
            onClick={() => { setSavingsGroup('all'); setSelectedCategories(['__auto__']); }}
            className={`flex items-center justify-center px-2 sm:px-3 py-1.5 rounded-xl border transition-all duration-200 min-h-[44px] touch-manipulation ${savingsGroup === 'all'
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400'
            }`}
          >
            <span className="text-sm">All</span>
          </button>
        </div>

        {/* Amount Field */}
        <div className="space-y-1 sm:space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('savings.amount')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              ref={amountRef}
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              onWheel={(e) => {
                // Prevent accidental value changes when scrolling over the input
                // blur the input so the wheel doesn't change the value
                (e.currentTarget as HTMLInputElement).blur();
              }}
              onKeyDown={(e) => {
                // Prevent arrow keys from incrementing/decrementing
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                }
              }}
              inputMode="decimal"
              pattern="[0-9]*([.,][0-9]+)?"
              className="w-full pl-7 pr-2 py-1.5 sm:py-1.5 rounded-xl border border-gray-300 
                focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  dark:bg-gray-800 dark:border-gray-700 transition-all duration-200
                  hover:border-indigo-300 min-h-[32px] touch-manipulation"
              placeholder="0.00"
              required
            />
            {formError && (
              <p className="text-sm text-red-500 mt-1">{formError}</p>
            )}
          </div>
        </div>

        {/* Category Field (multi-select with radio/checkbox) */}
        <div className="space-y-2 sm:space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('savings.category')}
            </label>
            <button
              type="button"
              onClick={toggleAutoAllocate}
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              {t('savings.auto_allocate')}
            </button>
          </div>

          <div className="space-y-2 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="auto-allocate"
                checked={selectedCategories.includes('__auto__') || selectedCategories.length === 0}
                onChange={toggleAutoAllocate}
                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('savings.auto_allocate')}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {getSavingsCategories(savingsGroup).map((category) => {
                const checked = selectedCategories.includes(category.id);
                return (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(category.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                      {category.label} ({category.percentage}%)
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {selectedCategories.includes('__auto__') || selectedCategories.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('savings.auto_allocate_hint')}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('savings.manual_allocate_hint', 'Amount will be split evenly across selected categories.')}
            </p>
          )}
        </div>

        {/* Date Field */}
        <div className="space-y-1 sm:space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('savings.date')}
          </label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MMMM d, yyyy"
            maxDate={new Date()}
            minDate={new Date(2000, 0, 1)}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            customInput={<CustomDateInput />}
            calendarClassName="bg-white dark:bg-gray-800 border dark:border-gray-700 
            rounded-xl shadow-lg p-4"
            dayClassName={date =>
              date.getDate() === selectedDate?.getDate() &&
                date.getMonth() === selectedDate?.getMonth()
                ? "bg-indigo-500 text-white rounded-full"
                : "hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-full"
            }
            popperClassName="z-50"
            popperModifiers={[{ name: 'offset', options: { offset: [0, 8] }, fn: () => ({}) as any }]}
            wrapperClassName="w-full"
          />
        </div>

        {/* Description Field */}
        <div className="space-y-1 sm:space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('savings.description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="w-full px-3 py-1.5 sm:py-1.5 rounded-xl border border-gray-300 
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              dark:bg-gray-800 dark:border-gray-700 transition-all duration-200
              hover:border-indigo-300 resize-none min-h-[56px] touch-manipulation"
            rows={2}
            placeholder={t('savings.description_placeholder')}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 mt-3 sm:mt-5">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="w-full sm:w-1/2 min-h-[36px] touch-manipulation"
            disabled={isSubmitting}
            type="button"
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            className={`w-full sm:w-1/2 min-h-[36px] touch-manipulation ${transactionType === 'credit'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
              }`}
          >
            {isSubmitting ? t('savings.saving') : (transactionType === 'credit' ? t('savings.add_credit') : t('savings.add_debit'))}
          </Button>
        </div>
      </form>
    </div>
  );
};