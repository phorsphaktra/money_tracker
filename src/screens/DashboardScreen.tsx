import { useMemo } from 'react';
import { CardStats } from '../components/CardStats';
import { SpendingChart } from '../components/SpendingChart';
import { TransactionsList } from '../components/transaction/TransactionsList';
import { useTransactions } from '../contexts/TransactionContext';
import { calculateDashboardStats } from '../utils/statsCalculator';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from 'i18next';

const formatNumber = (num: number, language: string) => {
  if (language === 'km') {
    const khmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return num.toLocaleString('en-US', { minimumFractionDigits: 2 })
      .replace(/[0-9]/g, digit => khmerNumerals[parseInt(digit)]);
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 2 });
};

const formatCurrency = (amount: number, language: string, currency: string = 'USD') => {
  const khmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  const value = amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
  
  if (language === 'km') {
    const khmerValue = value.replace(/[0-9]/g, d => khmerNumerals[parseInt(d)]);
    return currency === 'KHR' ? `${khmerValue}៛` : `$${khmerValue}`;
  }
  
  return currency === 'KHR' ? `${value}៛` : `$${value}`;
};

export const DashboardScreen = () => {
    const { transactions, isLoading, error } = useTransactions();
    const { t } = useTranslation();
    const { language } = useLanguage();
    
    const stats = useMemo(() => 
      calculateDashboardStats(transactions), [transactions]
    );

    if (isLoading) {
      return (
        <div className="grid gap-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
        return <DashboardError error={error} />;
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('dashboard.subtitle')}
          </p>
        </header>
        
        <StatsGrid stats={stats} isLoading={isLoading} language={language} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('dashboard.spending_overview')}
              </h3>
              <select className="text-sm border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500">
                <option>{t('dashboard.last_6_months')}</option>
                <option>{t('dashboard.last_3_months')}</option>
                <option>{t('dashboard.this_year')}</option>
              </select>
            </div>
            <SpendingChart 
              transactions={transactions} 
              isLoading={isLoading} 
            />
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('dashboard.overview.recent_transactions')}
              </h3>
              <button 
                onClick={() => {}} 
                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
              >
                {t('dashboard.overview.view_all')}
              </button>
            </div>
            <div className="overflow-hidden">
              <TransactionsList 
                transactions={transactions}
                isLoading={isLoading}
                limit={5}
                showFilters={false}
              />
            </div>
          </div>
        </div>
      </div>
    );
};

const DashboardError = ({ error }: { error: Error }) => (
  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
    <div className="flex items-center">
      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      Error: {error.message}
    </div>
  </div>
);

const StatsGrid = ({ stats, isLoading, language }: { 
  stats: ReturnType<typeof calculateDashboardStats>, 
  isLoading: boolean,
  language: string 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <CardStats
      title={t('dashboard.overview.total_balance')}
      value={formatCurrency(stats.totalBalance, language)}
      trend={`${formatNumber(Number(stats.balanceTrend), language)}%`}
      isPositive={Number(stats.balanceTrend) >= 0}
      isLoading={isLoading}
      icon="wallet"
    />
    <CardStats
      title={t('dashboard.monthly_spending')}
      value={`$${formatNumber(stats.currentSpending, language)}`}
      trend={`${formatNumber(Number(stats.spendingTrend), language)}%`}
      isPositive={Number(stats.spendingTrend) < 0}
      isLoading={isLoading}
      icon="spending"
    />
    <CardStats
      title={t('dashboard.monthly_income')}
      value={`$${formatNumber(stats.currentIncome, language)}`}
      trend={`${formatNumber(Number(stats.incomeTrend), language)}%`}
      isPositive={Number(stats.incomeTrend) >= 0}
      isLoading={isLoading}
      icon="income"
    />
    <CardStats
      title={t('dashboard.savings_rate')}
      value={`${formatNumber(Number(stats.savingsRate), language)}%`}
      trend={`${formatNumber(Number(stats.savingsTrend), language)}%`}
      isPositive={Number(stats.savingsTrend) >= 0}
      isLoading={isLoading}
      icon="savings"
    />
  </div>
);


