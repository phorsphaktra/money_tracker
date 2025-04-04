import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { SignUpScreen } from './components/auth/SignUpScreen';
import { SplashScreen } from './screens/SplashScreen';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DashboardScreen } from './screens/DashboardScreen';
import { TransactionsScreen } from './screens/TransactionScreen'
import { TransactionProvider } from './contexts/TransactionContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { AnalyticsView } from './components/analytics/AnalyticsView';

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);
  const { isAuthenticated } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('/');

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return showSignUp ? (
      <SignUpScreen onSwitchToLogin={() => setShowSignUp(false)} />
    ) : (
      <LoginScreen onSwitchToSignUp={() => setShowSignUp(true)} />
    );
  }

  return (
    <DashboardLayout onNavigate={setCurrentRoute}>
      {currentRoute === '/' && <DashboardScreen />}
      {currentRoute === '/transactions' && <TransactionsScreen />}
      {currentRoute === '/analytics' && <AnalyticsView />}
    </DashboardLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <TransactionProvider>
          <AppContent />
        </TransactionProvider>
      </LoadingProvider>
    </AuthProvider>
  );
}
