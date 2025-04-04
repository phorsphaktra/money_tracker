import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from '../Sidebar';

export const DashboardLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar onNavigate={function (path: string): void {
        throw new Error('Function not implemented.');
      } } />
      <div className="flex-1">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end h-16">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 my-3 border border-transparent 
                         text-sm font-medium rounded-md text-white bg-indigo-600 
                         hover:bg-indigo-700 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
