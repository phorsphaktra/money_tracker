import { Bars3Icon, BellIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { NotificationPanel } from './notification/NotificationPanel';
import { MemberSwitcher } from './member/MemberSwitcher';
import { useTaskContext } from '../contexts/TaskContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useDarkMode } from '../contexts/DarkModeContext';

interface NavbarProps {
  onToggle: () => void;
  isCollapsed: boolean;
}

export const Navbar = ({ onToggle, isCollapsed }: NavbarProps) => {
  useAuth();
  const { t } = useTranslation();
  useTaskContext();
  const [showNotifications, setShowNotifications] = useState(false);
  // tooltip state removed; badge derives from notification context
  const { 
    notificationCounts, 
    totalNotifications, 
    pendingInvites,
    isLoading  } = useNotifications();
  const { darkMode, toggleDarkMode } = useDarkMode();

  // user photo key is available in localStorage if needed

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  // pendingInvites is provided by NotificationContext and updates automatically

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

        <div className="flex items-center gap-4">
          <MemberSwitcher showLabel={false} />
          
          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode}>
              {darkMode ? <SunIcon className="w-5 h-5 dark:text-slate-400" /> : <MoonIcon className="w-5 h-5 dark:text-slate-400" />}
            </button>
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="relative p-2 rounded-full text-slate-500 hover:text-slate-700 
                dark:text-slate-400 dark:hover:text-slate-200
                hover:bg-slate-100 dark:hover:bg-slate-700/50
                transition-all"
            >
              <BellIcon className="w-5 h-5" />
              {(!isLoading && (totalNotifications > 0 || (pendingInvites && pendingInvites.length > 0))) && (
                <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1
                  flex items-center justify-center rounded-full text-xs font-medium
                  ${notificationCounts.overdue > 0 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : ((pendingInvites && pendingInvites.length > 0) ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white')}`}
                >
                  {(pendingInvites && pendingInvites.length > 0) ? pendingInvites.length : totalNotifications}
                </span>
              )}
            </button>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0" 
                  onClick={() => setShowNotifications(false)} 
                />
                <NotificationPanel 
                  onClose={() => setShowNotifications(false)}
                  onRefresh={() => setShowNotifications(!showNotifications)}
                />
              </>
            )}
          </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
