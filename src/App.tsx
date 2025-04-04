import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <TransactionProvider>
          <DarkModeProvider>
            <RouterProvider router={router} />
          </DarkModeProvider>
        </TransactionProvider>
      </LoadingProvider>
    </AuthProvider>
  );
}
