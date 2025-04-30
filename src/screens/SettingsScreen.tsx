import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

export const SettingsScreen = () => {
  useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [currency, setCurrency] = useState(() => 
    localStorage.getItem('currency') || 'USD'
  );

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    localStorage.setItem('currency', value);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('settings.subtitle')}
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('settings.appearance.title')}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">
              {t('settings.appearance.darkMode')}
            </span>
            <button
              onClick={toggleDarkMode}
              role="switch"
              aria-checked={darkMode}
              className={`${
                darkMode ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span className="sr-only">Enable dark mode</span>
              <span
                className={`${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('settings.preferences.title')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">
                {t('settings.preferences.currency')}
              </span>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              >
                <option value="USD">USD ($)</option>
                <option value="KHR">KHR (៛)</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">
                {t('settings.preferences.language')}
              </span>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="en">English</option>
                <option value="km">ខ្មែរ</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
