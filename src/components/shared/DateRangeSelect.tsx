import { useState, useMemo, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, CalendarDaysIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRangeSelectProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
  className?: string;
}

export const DateRangeSelect = ({
  startDate,
  endDate,
  onDateChange,
  className = ''
}: DateRangeSelectProps) => {
  const { t } = useTranslation();
  const [showCustom, setShowCustom] = useState(false);

  const ranges = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfDay = (date: Date) => {
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return end;
    };

    return [
      { 
        label: t('transactions.dateRange.allTime'), 
        start: null, 
        end: null 
      },
      {
        label: t('transactions.dateRange.today'),
        start: today,
        end: endOfDay(today)
      },
      {
        label: t('transactions.dateRange.yesterday'),
        start: yesterday,
        end: endOfDay(yesterday)
      },
      {
        label: t('transactions.dateRange.thisWeek'),
        start: startOfWeek,
        end: endOfDay(today)
      },
      {
        label: t('transactions.dateRange.last7Days'),
        start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        end: endOfDay(today)
      },
      {
        label: t('transactions.dateRange.thisMonth'),
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      },
      {
        label: t('transactions.dateRange.lastMonth'),
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)
      },
      {
        label: t('transactions.dateRange.custom'),
        start: null,
        end: null
      }
    ];
  }, [t]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const currentLabel = startDate || endDate
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : t('transactions.dateRange.allTime');

  return (
    <div className={`relative ${className}`}>
      <Menu as="div" className="relative inline-block text-left w-full">
        {({ open }) => (
          <>
            <Menu.Button className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm 
              rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 
              dark:hover:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              transition-colors duration-150">
              <span className="flex items-center gap-2">
                <CalendarDaysIcon className={`h-4 w-4 ${open ? 'text-indigo-500' : 'text-gray-500'}`} />
                <span className="truncate font-medium">{currentLabel}</span>
              </span>
              <ChevronDownIcon className={`h-4 w-4 transform transition-transform duration-150 
                ${open ? 'rotate-180 text-indigo-500' : 'text-gray-400'}`} />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right bg-white 
                dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 
                divide-y divide-gray-100 dark:divide-gray-700 z-10 focus:outline-none">
                <div className="p-2">
                  {ranges.map((range) => (
                    <Menu.Item key={range.label}>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 
                              'text-gray-700 dark:text-gray-300'
                          } w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150
                          hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 
                          dark:hover:text-indigo-400`}
                          onClick={() => {
                            if (range.label === t('dateRange.custom')) {
                              setShowCustom(true);
                            } else {
                              onDateChange(range.start, range.end);
                              setShowCustom(false);
                            }
                          }}
                        >
                          {range.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>

      <Transition
        show={showCustom}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg 
          shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-20">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 
              dark:border-gray-700 pb-3">
              <h3 className="text-sm font-medium">{t('dateRange.custom')}</h3>
              <button
                onClick={() => setShowCustom(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors duration-150"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 
                  dark:text-gray-300">{t('dateRange.startDate')}</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => onDateChange(date, endDate)}
                  maxDate={endDate || undefined}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                    dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 
                    focus:border-transparent"
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 
                  dark:text-gray-300">{t('dateRange.endDate')}</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => onDateChange(startDate, date)}
                  minDate={startDate || undefined}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 
                    dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 
                    focus:border-transparent"
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select date"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
};
