import './i18n/config';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { TaskProvider } from './contexts/TaskContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { router } from './routes';
import { SavingProvider } from './contexts/SavingContext';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <LoadingProvider>
          <TransactionProvider>
            <SavingProvider>
              <LanguageProvider>
                <DarkModeProvider>
                  <TaskProvider>
                    <NotificationProvider>
                      <RouterProvider router={router} />
                    </NotificationProvider>
                  </TaskProvider>
                </DarkModeProvider>
              </LanguageProvider>
            </SavingProvider>
          </TransactionProvider>
        </LoadingProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
