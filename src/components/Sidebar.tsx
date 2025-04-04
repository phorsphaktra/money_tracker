import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  name: string;
  icon: JSX.Element;
  path: string;
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    path: '/',
  },
  {
    name: 'Transactions',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    path: '/transactions',
  },
  {
    name: 'Analytics',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    path: '/analytics',
  },
  {
    name: 'Settings',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    path: '/settings',
  },
];

interface SidebarProps {
  onNavigate: (path: string) => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activePath, setActivePath] = useState('/');
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

  const handleNavigation = (path: string) => {
    setActivePath(path);
    setIsOpen(false);
    onNavigate(path);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-2.5 rounded-lg bg-white shadow-lg border text-gray-600 hover:text-indigo-600 hover:border-indigo-600 transition-colors"
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
        fixed lg:sticky top-0 left-0 h-screen w-72 bg-white shadow-xl transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 transition-all duration-300 ease-in-out z-20
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">Money Tracker</h1>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full shadow-lg ring-4 ring-white overflow-hidden">
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
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-3xl text-white font-semibold">
                      {user?.email?.[0].toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <p className="font-medium text-gray-900 truncate">
                {user?.displayName || 'User'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                ${activePath === item.path 
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              {item.icon}
              <span className="font-medium tracking-wide">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Sign out and Version */}
        <div className="border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full px-4 py-3 text-sm text-gray-600 hover:text-indigo-600 hover:bg-gray-50 flex items-center justify-center group transition-colors"
          >
            <svg className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
          <div className="p-2 text-xs text-center text-gray-400">
            Version 1.0.0
          </div>
        </div>
      </div>
    </>
  );
};
