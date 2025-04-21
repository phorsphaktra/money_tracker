import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionScreen';
import { AnalyticsView } from '../components/analytics/AnalyticsView';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoginScreen } from '../components/auth/LoginScreen';
import { SignUpScreen } from '../components/auth/SignUpScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { PrivateRoute } from './PrivateRoute';
import { useAuth } from '../contexts/AuthContext';

const AuthRedirect = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : null;
};

export const router = createBrowserRouter([
  {
    path: '/splash',
    element: <SplashScreen onFinish={() => <Navigate to="/" replace />} />
  },
  {
    path: '/login',
    element: (
      <>
        <AuthRedirect />
        <LoginScreen onSwitchToSignUp={() => <Navigate to="/signup" />} />
      </>
    )
  },
  {
    path: '/signup',
    element: (
      <>
        <AuthRedirect />
        <SignUpScreen onSwitchToLogin={() => <Navigate to="/login" />} />
      </>
    )
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <DashboardScreen /> },
      { path: 'transactions', element: <TransactionsScreen /> },
      { path: 'analytics', element: <AnalyticsView /> },
      { path: 'settings', element: <SettingsScreen /> }
    ]
  }
]);
