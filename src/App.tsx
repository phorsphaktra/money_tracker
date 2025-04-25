import './i18n/config';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { TaskProvider } from './contexts/TaskContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { router } from './routes';

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <NotificationProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </NotificationProvider>
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;
