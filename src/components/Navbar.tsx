import { Bars3Icon, BellIcon, MagnifyingGlassIcon, SunIcon, MoonIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

interface NavbarProps {
  onToggle: () => void;
  isCollapsed: boolean;
}

export const Navbar = ({ onToggle, isCollapsed }: NavbarProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const [localPhotoURL, setLocalPhotoURL] = useState<string>(() => 
    localStorage.getItem(`userPhoto_${user?.email}`) || ''
  );

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="px-4 h-16 mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 
              dark:text-slate-400 dark:hover:text-slate-200 
              hover:bg-slate-100 dark:hover:bg-slate-800 
              transition-all duration-200"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className={`w-6 h-6 transform transition-transform duration-200
              ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 
            dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            {t('main.appName')}
          </h1>
        </div>

        {/* <div className="flex-1 max-w-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="search"
              placeholder={t('dashboard.search')}
              className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-full pl-10 pr-4 py-2 text-sm
                border border-slate-200 dark:border-slate-700/50
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50
                placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div> */}


        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
          <button className="relative p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500" />
          </button>
{/*           
          <div className="h-8 border-l border-slate-200 dark:border-slate-700/50" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {user?.displayName}
            </span>
            <div className="w-9 h-9 rounded-full bg-indigo-500/10 ring-2 ring-indigo-500/20 overflow-hidden">
              {(user?.photoURL || localPhotoURL) ? (
                    <img 
                      src={localPhotoURL || user?.photoURL || ''}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setLocalPhotoURL('')}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-500
                      flex items-center justify-center">
                      <span className="text-2xl text-white font-medium">
                        {user?.displayName?.[0].toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
            </div>
          </div> */}
        </div>
      </div>
    </nav>
  );
};
