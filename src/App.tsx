import './i18n/config';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { TaskProvider } from './contexts/TaskContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <TransactionProvider>
          <LanguageProvider>
            <DarkModeProvider>
              <TaskProvider>
                <RouterProvider router={router} />
              </TaskProvider>
            </DarkModeProvider>
          </LanguageProvider>
        </TransactionProvider>
      </LoadingProvider>
    </AuthProvider>
  );
}
