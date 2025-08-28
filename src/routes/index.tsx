import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { PrivateRoute } from './PrivateRoute';
import { useAuth } from '../contexts/AuthContext';
import { TasksScreen } from '../screens/TasksScreen';
import SavingScreen from '../screens/SavingScreen';
import SavingsPlanner from '../screens/SavingPlanerScreen';

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
        <LoginScreen />
      </>
    )
  },
  {
    path: '/signup',
    element: (
      <>
        <AuthRedirect />
        <SignUpScreen />
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
      { path: 'saving', element: <SavingScreen /> },
  { path: 'saving/planner', element: <SavingsPlanner /> },
      { path: 'analytics', element: <AnalyticsScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      { path: 'task', element: <TasksScreen /> }
    ]
  }
]);
