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
  Bars3Icon
} from '@heroicons/react/24/outline';

const navItems = [
  { path: '/', label: 'dashboard.navigation.dashboard', icon: HomeIcon },
  { path: '/transactions', label: 'dashboard.navigation.transactions', icon: CurrencyDollarIcon },
  { path: '/analytics', label: 'dashboard.navigation.analytics', icon: ChartBarIcon },
  { path: '/settings', label: 'dashboard.navigation.settings', icon: Cog6ToothIcon },
];

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [localPhotoURL, setLocalPhotoURL] = useState<string>(() => 
    localStorage.getItem(`userPhoto_${user?.email}`) || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-xl
        bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm ring-1 ring-slate-200/50 
        dark:ring-slate-700/50 text-slate-700 dark:text-slate-200
        hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-10"
          onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-80
        bg-white dark:bg-slate-900
        border-r border-slate-200/50 dark:border-slate-700/50
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 transition-transform duration-200 ease-out z-30
        flex flex-col
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 
            dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
        </div>

        <div className="px-6 py-4">
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}>
              <div className="w-20 h-20 rounded-full ring-2 ring-indigo-500/20 dark:ring-indigo-400/20
                overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50
                dark:from-slate-800 dark:to-slate-700">
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
            <div className="mt-3 text-center">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {user?.displayName || 'User'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 my-1 text-sm font-medium rounded-xl
                transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              {t(label)}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={logout}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium
              text-slate-600 dark:text-slate-400 
              hover:bg-red-50 dark:hover:bg-red-500/10
              hover:text-red-600 dark:hover:text-red-400
              flex items-center justify-center group transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2 group-hover:translate-x-0.5 transition-transform" />
            {t('dashboard.header.signOut')}
          </button>
          <div className="mt-4 text-xs text-center text-slate-400 dark:text-slate-500">
            {t('dashboard.version')} 1.0.0
          </div>
        </div>
      </aside>
    </>
  );
};
