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
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
}

const navItems = [
  { path: '/', label: 'dashboard.navigation.dashboard', icon: HomeIcon },
  { path: '/transactions', label: 'dashboard.navigation.transactions', icon: CurrencyDollarIcon },
  { path: '/analytics', label: 'dashboard.navigation.analytics', icon: ChartBarIcon },
  { path: '/settings', label: 'dashboard.navigation.settings', icon: Cog6ToothIcon },
  { path: '/task', label: 'dashboard.navigation.task', icon: Cog6ToothIcon },
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
      alert('Image size should be less than 5MB');
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

  return (
    <>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed lg:sticky top-16 left-0 h-[calc(100vh-64px)]
        bg-white dark:bg-slate-900
        border-r border-slate-200/50 dark:border-slate-700/50
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 transition-all duration-300 ease-out z-20
        flex flex-col overflow-hidden
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72
      `}>
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Profile section */}
          <div className={`p-4 border-b border-slate-200/50 dark:border-slate-700/50
            ${isCollapsed ? 'items-center' : ''}`}>
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer"
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
                  bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CameraIcon className="w-6 h-6 text-white" />
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

          {/* Navigation */}
          <nav className="flex-1 p-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                title={isCollapsed ? t(label) : undefined}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center' : ''} 
                  px-4 py-3 my-1 text-sm font-medium rounded-xl
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-violet-50/50 dark:from-indigo-500/10 dark:to-violet-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`
                }
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110
                  ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && <span className="font-medium">{t(label)}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-2 border-t border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={logout}
            title={isCollapsed ? t('dashboard.header.signOut') : undefined}
            className={`w-full rounded-xl text-sm font-medium
              text-slate-600 dark:text-slate-400 
              hover:bg-red-50 dark:hover:bg-red-500/10
              hover:text-red-600 dark:hover:text-red-400
              flex items-center ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'}
              transition-all duration-200 group`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 group-hover:translate-x-0.5" />
            {!isCollapsed && <span className="ml-2">{t('dashboard.header.signOut')}</span>}
          </button>
          {!isCollapsed && (
            <div className="mt-4 text-xs text-center text-slate-400 dark:text-slate-500">
              {t('dashboard.version')} 1.0.0
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
