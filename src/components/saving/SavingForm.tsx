import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import { Button } from '../shared/Button';
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { MiddlewareReturn } from '@floating-ui/core';

interface SavingFormProps {
  amount?: string;
  description?: string;
  selectedDate?: Date;
  onSubmit: (saving: { amount: number; description: string; date: string }) => Promise<void>;
  onCancel: () => void;
  onAmountChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  onDateChange?: (date: Date) => void;
}

// Add custom input component for the date picker
const CustomDateInput = React.forwardRef<HTMLDivElement, { value?: string; onClick?: () => void }>(
  ({ value, onClick }, ref) => (
    <div className="relative group" ref={ref}>
      <div
        className="w-full px-4 pl-11 py-3 rounded-xl border border-gray-300 
          focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent
          dark:border-gray-700 hover:border-indigo-300 
          transition-all duration-200 cursor-pointer
          dark:bg-gray-800"
        onClick={onClick}
      >
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <CalendarIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
        </div>
        <input
          value={value}
          className="w-full bg-transparent outline-none cursor-pointer"
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
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(initialAmount);
  const [description, setDescription] = useState(initialDescription);
  const [selectedDate, setSelectedDate] = useState(initialDate);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    await onSubmit({
      amount: parseFloat(amount),
      description,
      date: selectedDate.toISOString()
    });
  };

  return (
    <div className="relative">
      {/* Close button for mobile */}
      <button
        onClick={onCancel}
        className="absolute -top-2 -right-2 p-2 rounded-full bg-gray-100 
          dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
          transition-colors duration-200 md:hidden"
      >
        <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t('savings.add_new')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('savings.form_subtitle')}
          </p>
        </div>

        {/* Amount Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('savings.amount')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 
                focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                dark:bg-gray-800 dark:border-gray-700 transition-all duration-200
                hover:border-indigo-300"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Date Field */}
        <div className="space-y-2">
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
            popperModifiers={[
              {
                  name: "offset",
                  options: {
                      offset: [0, 8]
                  },
                  fn: function (): MiddlewareReturn | Promise<MiddlewareReturn> {
                      throw new Error('Function not implemented.');
                  }
              }
            ]}
            wrapperClassName="w-full"
          />
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('savings.description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              dark:bg-gray-800 dark:border-gray-700 transition-all duration-200
              hover:border-indigo-300 resize-none"
            rows={2}
            placeholder={t('savings.description_placeholder')}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 mt-8">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="w-full sm:w-1/2"
            type="button"
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="w-full sm:w-1/2"
          >
            {t('savings.add')}
          </Button>
        </div>
      </form>
    </div>
  );
};