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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('dashboard.subtitle')}
          </p>
        </header>
        
        <StatsGrid stats={stats} isLoading={isLoading} language={language} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('dashboard.spending_overview')}
              </h3>
              <select className="text-sm border-gray-300 rounded-md">
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
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('dashboard.overview.recent_transactions')}
              </h3>
              <button onClick={() => {}} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                {t('dashboard.overview.view_all')}
              </button>
            </div>
            <TransactionsList 
              transactions={transactions}
              isLoading={isLoading}
              limit={5}
              showFilters={false}
            />
          </div>
        </div>
      </div>
    );
};


const DashboardError = ({ error }: { error: Error }) => (
  <div className="text-red-500">Error: {error.message}</div>
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
    />
    <CardStats
      title={t('dashboard.monthly_spending')}
      value={`$${formatNumber(stats.currentSpending, language)}`}
      trend={`${formatNumber(Number(stats.spendingTrend), language)}%`}
      isPositive={Number(stats.spendingTrend) < 0}
      isLoading={isLoading}
    />
    <CardStats
      title={t('dashboard.monthly_income')}
      value={`$${formatNumber(stats.currentIncome, language)}`}
      trend={`${formatNumber(Number(stats.incomeTrend), language)}%`}
      isPositive={Number(stats.incomeTrend) >= 0}
      isLoading={isLoading}
    />
    <CardStats
      title={t('dashboard.savings_rate')}
      value={`${formatNumber(Number(stats.savingsRate), language)}%`}
      trend={`${formatNumber(Number(stats.savingsTrend), language)}%`}
      isPositive={Number(stats.savingsTrend) >= 0}
      isLoading={isLoading}
    />
  </div>
);


