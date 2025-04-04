import { useState } from 'react';

export const SettingsScreen = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`${
                  darkMode ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span
                  className={`${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Currency</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="KHR">KHR (៛)</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
                >
                  <option value="en">English</option>
                  <option value="km">ខ្មែរ</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
