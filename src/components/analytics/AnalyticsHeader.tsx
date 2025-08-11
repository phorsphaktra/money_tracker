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
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">{t('analytics.title')}</h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 sm:mt-2">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onRefetch}
            disabled={isRefetching}
            className={`p-2 sm:p-2.5 rounded-lg bg-white/10 text-white hover:bg-white/20 
              transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              min-h-[44px] min-w-[44px] touch-manipulation
              ${isRefetching ? 'animate-spin' : ''}`}
          >
            <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg 
                hover:bg-white/20 transition-colors duration-200 min-h-[44px] touch-manipulation"
            >
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-white whitespace-nowrap">{selectedYear}</span>
              <ChevronDownIcon className={`w-3 h-3 sm:w-4 sm:h-4 text-white/70 transition-transform duration-200 flex-shrink-0
                ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                <div className="absolute right-0 mt-2 w-40 sm:w-48 rounded-xl bg-white dark:bg-gray-800 
                  shadow-lg ring-1 ring-black/5 z-40 py-1 max-h-80 overflow-auto">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        onYearChange(year);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-2 text-sm hover:bg-gray-100 
                        dark:hover:bg-gray-700 transition-colors duration-200 min-h-[44px] touch-manipulation
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