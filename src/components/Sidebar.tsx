import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  onNavigate: (path: string) => void;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/transactions', label: 'Transactions', icon: '💰' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export const Sidebar = ({ }: SidebarProps) => {
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [] = useState('/');
  const [localPhotoURL, setLocalPhotoURL] = useState<string>(() => {
    const stored = localStorage.getItem(`userPhoto_${user?.email}`);
    return stored || '';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Add file size check
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
    }
  };


  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-2.5 rounded-lg 
        bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg 
        border dark:border-slate-700/50 text-gray-700 dark:text-slate-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-screen w-72
        bg-gradient-to-b from-white via-white to-gray-50/80
        dark:from-slate-900 dark:via-slate-900 dark:to-slate-800
        shadow-xl dark:shadow-slate-950/30 transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 transition-all duration-300 ease-in-out z-20
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 
          dark:from-indigo-500/10 dark:to-purple-500/10 border-b border-gray-100/20 dark:border-slate-700/30">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 
            dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Money Tracker
          </h1>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-100/20 dark:border-slate-700/30 from-gray-50/50 to-white/50 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full shadow-lg 
                ring-4 ring-white/80 dark:ring-slate-700/80 
                bg-gradient-to-br from-gray-100 to-white 
                dark:from-slate-800 dark:to-slate-900 
                overflow-hidden">
                {(user?.photoURL || localPhotoURL) ? (
                  <img 
                    src={localPhotoURL || user?.photoURL || ''} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      setLocalPhotoURL('');
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 
                    dark:from-indigo-400 dark:to-purple-500 
                    flex items-center justify-center">
                    <span className="text-3xl text-white font-semibold">
                      {user?.displayName?.[0].toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center 
                  bg-gradient-to-br from-slate-900/60 to-slate-900/80 
                  opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full"
              >
                <svg className="w-8 h-8 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <div className="mt-3 min-w-0 w-full">
              <p className="font-medium bg-gradient-to-r from-gray-900 to-gray-700 
                dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                {user?.displayName || 'User'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1 space-y-1 overflow-y-auto 
          bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          {navItems.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/20 dark:to-purple-400/20 text-indigo-600 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50/80 dark:hover:bg-slate-800/80'
                }`
              }
            >
              <span className="mr-3">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out and Version */}
        <div className="border-t border-gray-100/20 dark:border-slate-700/30 
          bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <button
            onClick={logout}
            className="w-full px-4 py-3 text-sm text-gray-600 dark:text-slate-400 
            hover:bg-red-500/10 dark:hover:bg-red-400/10
            hover:text-red-600 dark:hover:text-red-300
            flex items-center justify-center group transition-all"
          >
            <svg className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
          <div className="p-2 text-xs text-center text-gray-400/70 dark:text-slate-500">
            Version 1.0.0
          </div>
        </div>
      </div>
    </>
  );
};
