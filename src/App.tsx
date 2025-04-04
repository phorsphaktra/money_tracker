import './i18n/config';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <TransactionProvider>
          <LanguageProvider>
            <DarkModeProvider>
              <RouterProvider router={router} />
            </DarkModeProvider>
          </LanguageProvider>
        </TransactionProvider>
      </LoadingProvider>
    </AuthProvider>
  );
}
