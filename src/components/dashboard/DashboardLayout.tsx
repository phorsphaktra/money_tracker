import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from '../Sidebar';
import { useDarkMode } from '../../contexts/DarkModeContext';

export const DashboardLayout = () => {
  const { isAuthenticated } = useAuth();
  const { darkMode } = useDarkMode();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-200 
      ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50/80'}`}
    >
      <Sidebar />
      <div className="flex-1">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
