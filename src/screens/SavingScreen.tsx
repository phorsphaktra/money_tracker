import React, { useEffect, useState } from 'react';
import { useSaving } from '../contexts/SavingContext';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { FloatingActionButton } from '../components/shared/FloatingActionButton';
import { formatUSD } from '../utils/currencyUtils';
import 'react-datepicker/dist/react-datepicker.css';
import { SavingForm } from '../components/saving/SavingForm';
import { Saving } from '../services/savingService';
import { SavingList } from '../components/saving/SavingList';

const SavingScreen: React.FC = () => {
  const { t } = useTranslation();
  const { state, loadSavings, loadSavingsByType, addSaving, deleteSaving, updateSaving } = useSaving();
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const { savings, summary, isLoading, error } = state;
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'credit' | 'debit'>('all');
  const [] = useState<{ start: Date | null, end: Date | null }>({
    start: null,
    end: null
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedType === 'all') {
      loadSavings();
    } else {
      loadSavingsByType(selectedType);
    }
  }, [loadSavings, loadSavingsByType, selectedType]);

  const handleSubmit = async (savingData: { amount: number; description: string; date: string; categoryId?: string; type: 'credit' | 'debit' }) => {
    if (!savingData.amount) return;

    try {
      if (editingId) {
        await updateSaving(editingId, {
          amount: savingData.amount,
          date: savingData.date,
          description: savingData.description,
          categoryId: savingData.categoryId,
          type: savingData.type
        });
      } else {
        await addSaving({
          amount: savingData.amount,
          date: savingData.date,
          description: savingData.description,
          categoryId: savingData.categoryId,
          type: savingData.type
        });
      }

      resetForm();
      // Reload savings based on current type filter
      if (selectedType === 'all') {
        loadSavings();
      } else {
        loadSavingsByType(selectedType);
      }
    } catch (error) {
      console.error('Error saving:', error);
      throw error;
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setSelectedDate(new Date());
    setIsAddingNew(false);
    setEditingId(null);
  };

  const handleEdit = (saving: Saving) => {
    setAmount(saving.amount.toString());
    setDescription(saving.description || '');
    setSelectedDate(new Date(saving.date));
    setEditingId(saving.id);
    setIsAddingNew(true);
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" className="text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
            {t('savings.title')}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-indigo-100">
            {t('savings.subtitle')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 rounded-lg sm:rounded-xl">
            <p className="text-sm sm:text-base text-red-700">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          <div 
            className={`bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm cursor-pointer transition-all duration-200 ${
              selectedType === 'credit' ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => setSelectedType(current => current === 'credit' ? 'all' : 'credit')}
          >
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('savings.totalCredits')} ({summary.creditCount})
            </h3>
            <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
              +{formatUSD(summary.credits)}
            </p>
          </div>
          <div 
            className={`bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm cursor-pointer transition-all duration-200 ${
              selectedType === 'debit' ? 'ring-2 ring-red-500' : ''
            }`}
            onClick={() => setSelectedType(current => current === 'debit' ? 'all' : 'debit')}
          >
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('savings.totalDebits')} ({summary.debitCount})
            </h3>
            <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
              -{formatUSD(Math.abs(summary.debits))}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('savings.netBalance')}
            </h3>
            <p className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatUSD(summary.credits - summary.debits)}
            </p>
          </div>
        </div>
        
        {/* Savings List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl p-3 sm:p-4 shadow-sm">
          <SavingList
            savings={savings}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={deleteSaving}
          />
        </div>

        {/* Modal with improved mobile styling */}
        {isAddingNew && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <SavingForm
                amount={amount}
                description={description}
                selectedDate={selectedDate}
                onSubmit={handleSubmit}
                onCancel={resetForm}
                onAmountChange={setAmount}
                onDescriptionChange={setDescription}
                onDateChange={setSelectedDate}
              />
            </div>
          </div>
        )}

        {/* FAB with responsive positioning */}
        <FloatingActionButton
          onClick={() => setIsAddingNew(true)}
          label={t('savings.add')}
        />
      </div>
    </div>
  );
};

export default SavingScreen;