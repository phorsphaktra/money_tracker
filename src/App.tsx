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
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { MemberProvider } from './contexts/MemberContext';
import { NotificationHandler } from './components/notification/NotificationHandler';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <LoadingProvider>
          <TransactionProvider>
            <SavingProvider>
              <AnalyticsProvider>
                <LanguageProvider>
                  <DarkModeProvider>
                    <TaskProvider>
                      <NotificationProvider>
                        <MemberProvider>
                          <NotificationHandler>
                            <RouterProvider router={router} />
                          </NotificationHandler>
                        </MemberProvider>
                      </NotificationProvider>
                    </TaskProvider>
                  </DarkModeProvider>
                </LanguageProvider>
              </AnalyticsProvider>
            </SavingProvider>
          </TransactionProvider>
        </LoadingProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
