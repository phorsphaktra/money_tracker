import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  CameraIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  WalletIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
}

const navItems = [
  { path: '/', label: 'dashboard.navigation.dashboard', icon: HomeIcon },
  { path: '/transactions', label: 'dashboard.navigation.transactions', icon: CurrencyDollarIcon },
  { path: '/saving', label: 'dashboard.navigation.saving', icon: WalletIcon },
  { path: '/saving/planner', label: 'dashboard.navigation.savingsPlanner', icon: ChartBarIcon },
  { path: '/analytics', label: 'dashboard.navigation.analytics', icon: ChartBarIcon },
  { path: '/task', label: 'dashboard.navigation.task', icon: ClipboardDocumentCheckIcon },
  { path: '/settings', label: 'dashboard.navigation.settings', icon: Cog6ToothIcon },
];

export const Sidebar = ({ isOpen, setIsOpen, isCollapsed }: SidebarProps) => {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPhotoURL, setLocalPhotoURL] = useState<string>(() =>
    localStorage.getItem(`userPhoto_${user?.email}`) || ''
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(t('dashboard.header.profile.photoSize'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const photoURL = reader.result as string;
      setLocalPhotoURL(photoURL);
      if (user?.email) {
        localStorage.setItem(`userPhoto_${user.email}`, photoURL);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMobileNavClick = () => {
    if (window.innerWidth < 1024) { // 1024px is the lg breakpoint in Tailwind
      setIsOpen(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Mobile backdrop with improved blur and animation */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30 
          animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 lg:top-16 left-0 h-screen lg:h-[calc(100vh-64px)]
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-800
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 transition-all duration-200 ease-in-out
        flex flex-col
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} w-[280px]
        shadow-xl lg:shadow-none z-40
      `}>
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
              transition-all duration-200 active:scale-95"
          >
            <ArrowPathIcon className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
              transition-all duration-200 active:scale-95"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Profile section with improved animations */}
        <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer transform transition-transform duration-200 hover:scale-105"
              onClick={() => fileInputRef.current?.click()}>
              <div className={`${isCollapsed ? 'w-10 h-10' : 'w-16 h-16'} rounded-full 
                ring-2 ring-indigo-500/20 dark:ring-indigo-400/20
                overflow-hidden transition-all duration-300`}>
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
              <div className="absolute inset-0 rounded-full flex items-center justify-center
                bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <CameraIcon className="w-5 h-5 text-white transform scale-0 group-hover:scale-100 transition-transform duration-200" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            {!isCollapsed && (
              <div className="mt-3 text-center">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation with improved hover effects */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={true}
              onClick={handleMobileNavClick}
              className={({ isActive }) =>
                `group flex items-center ${isCollapsed ? 'justify-center' : ''} 
                px-4 py-3 my-1 rounded-xl text-sm font-medium
                transition-colors duration-200 ease-in-out
                ${isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`
              }
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110
                ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>{t(label)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer with improved styling */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={logout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} 
              px-4 py-3 rounded-xl text-sm font-medium
              text-gray-600 dark:text-gray-400 
              hover:bg-red-50 dark:hover:bg-red-900/20
              hover:text-red-600 dark:hover:text-red-400
              transition-all duration-200 transform hover:scale-[1.02]`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">{t('dashboard.header.signOut')}</span>}
          </button>
          {!isCollapsed && (
            <div className="mt-4 text-xs text-center text-slate-400 dark:text-slate-500">
              {t('dashboard.version')} {import.meta.env.VITE_APP_VERSION}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
