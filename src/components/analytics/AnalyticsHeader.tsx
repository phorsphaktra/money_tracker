import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsHeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  isRefetching: boolean;
  onRefetch: () => void;
}

export const AnalyticsHeader = ({ 
  selectedYear,
  onYearChange,
  isRefetching,
  onRefetch
}: AnalyticsHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('analytics.title')}</h1>
          <p className="text-sm text-indigo-100 mt-2">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onRefetch}
            disabled={isRefetching}
            className={`p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 
              transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              ${isRefetching ? 'animate-spin' : ''}`}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg 
                hover:bg-white/20 transition-colors duration-200"
            >
              <CalendarIcon className="w-5 h-5 text-white/70" />
              <span className="text-sm text-white">{selectedYear}</span>
              <ChevronDownIcon className={`w-4 h-4 text-white/70 transition-transform duration-200
                ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-gray-800 
                  shadow-lg ring-1 ring-black/5 z-40 py-1">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        onYearChange(year);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 
                        dark:hover:bg-gray-700 transition-colors duration-200
                        ${year === selectedYear
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 