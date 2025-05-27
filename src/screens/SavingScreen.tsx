import React, { useEffect, useState } from 'react';
import { useSaving } from '../contexts/SavingContext';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { DateRangeSelect } from '../components/shared/DateRangeSelect';
import { FloatingActionButton } from '../components/shared/FloatingActionButton';
import 'react-datepicker/dist/react-datepicker.css';
import { SavingForm } from '../components/saving/SavingForm';
import { Saving } from '../services/savingService';
import { SavingList } from '../components/saving/SavingList';

const SavingScreen: React.FC = () => {
  const { t } = useTranslation();
  const { state, loadSavings, addSaving, deleteSaving, updateSaving } = useSaving();
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const { savings, isLoading, error } = state;
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({
    start: null,
    end: null
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadSavings();
  }, [loadSavings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    try {
      if (editingId) {
        await updateSaving(editingId, {
          amount: parseFloat(amount),
          date: selectedDate.toISOString(),
          description
        });
      } else {
        await addSaving({
          amount: parseFloat(amount),
          date: selectedDate.toISOString(),
          description
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error saving:', error);
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

  const filteredSavings = savings.filter(saving => {
    const matchesSearch = saving.description?.toLowerCase().includes(search.toLowerCase()) || false;
    const savingDate = new Date(saving.date);
    const matchesDateRange =
      (!dateRange.start || savingDate >= dateRange.start) &&
      (!dateRange.end || savingDate <= dateRange.end);

    return matchesSearch && matchesDateRange;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" className="text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {t('savings.title')}
          </h1>
          <p className="text-indigo-100 text-sm md:text-base">
            {t('savings.subtitle')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search */}
            <div className="lg:col-span-8">
              <input
                type="text"
                placeholder={t('savings.search')}
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  dark:bg-gray-800 dark:border-gray-700 transition-all duration-200
                  hover:border-indigo-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Date Range */}
            <div className="lg:col-span-4">
              <DateRangeSelect
                startDate={dateRange.start}
                endDate={dateRange.end}
                onDateChange={(start, end) => setDateRange({ start, end })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Savings List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <SavingList
            savings={filteredSavings}
            onEdit={handleEdit}
            onDelete={deleteSaving}
          />
        </div>

        {/* Add New Saving Modal */}
        {isAddingNew && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
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

        {/* FAB */}
        <FloatingActionButton
          onClick={() => setIsAddingNew(true)}
          label={t('savings.add')}
        />
      </div>
    </div>
  );
};

export default SavingScreen;