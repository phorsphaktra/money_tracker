import { useMemo, useState } from 'react';
import { CardStats } from '../components/dashboard/CardStats';
import { useTransactions } from '../contexts/TransactionContext';
import { calculateDashboardStats } from '../utils/statsCalculator';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from 'i18next';
import { FloatingActionButton } from '../components/shared/FloatingActionButton';
import { TransactionModal } from '../components/transaction/TransactionModal';
import { SpendingChart } from '../components/dashboard/SpendingChart';
import { TransactionCard } from '../components/transaction/TransactionCard';
import { useNavigate } from 'react-router-dom';
import { filterTransactionsByPeriod } from '../utils/dateUtils';
import { useTaskContext } from '../contexts/TaskContext';

const formatNumber = (num: number, language: string) => {
  if (language === 'km') {
    const khmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return num.toLocaleString('en-US', { minimumFractionDigits: 2 })
      .replace(/[0-9]/g, digit => khmerNumerals[parseInt(digit)]);
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 2 });
};

export const DashboardScreen = () => {
    const { transactions, isLoading: transactionsLoading } = useTransactions();
    const { tasks, loading: tasksLoading } = useTaskContext();
    const { t } = useTranslation();
    const { language } = useLanguage();
    const [isAddingNew, setIsAddingNew] = useState(false);
    const navigate = useNavigate();
    const [period, setPeriod] = useState('6months');
    
    const stats = useMemo(() => 
      calculateDashboardStats(transactions), [transactions]
    );

    const filteredTransactions = useMemo(() => 
      filterTransactionsByPeriod(transactions, period), 
      [transactions, period]
    );

    const taskStats = useMemo(() => {
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const blocked = tasks.filter(t => t.status === 'blocked').length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        total,
        completed,
        inProgress,
        blocked,
        completionRate
      };
    }, [tasks]);

    const handleViewAll = () => {
      navigate('/transactions');
    };

    if (transactionsLoading || tasksLoading) {
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

    // if (transactionError || tasksError) {
    //     return <DashboardError error={transactionError || tasksError} />;
    // }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('dashboard.subtitle')}
          </p>
        </header>
        
        <StatsGrid stats={stats} isLoading={transactionsLoading} language={language} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('dashboard.spending_overview')}
              </h3>
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="text-sm border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="7days">{t('filters.7days')}</option>
                <option value="30days">{t('filters.30days')}</option>
                <option value="3months">{t('filters.3months')}</option>
                <option value="6months">{t('filters.6months')}</option>
                <option value="1year">{t('filters.1year')}</option>
                <option value="ytd">{t('filters.ytd')}</option>
              </select>
            </div>
            <SpendingChart 
              transactions={filteredTransactions}
              isLoading={transactionsLoading}
              period={period} 
            />
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('dashboard.overview.recent_transactions')}
              </h3>
              <button 
                onClick={handleViewAll}
                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
              >
                {t('dashboard.overview.view_all')}
              </button>
            </div>
            <div className="overflow-hidden space-y-2">
              {transactions.slice(0, 5).map((transaction, index) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  index={index}
                />
              ))}
              {transactions.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  {t('dashboard.no_transactions')}
                </p>
              )}
            </div>
          </div>
        </div>


        {/* Add Task Stats Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t('dashboard.task_overview')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CardStats
              title={t('dashboard.total_tasks')}
              value={taskStats.total.toString()}
              trend={`${formatNumber(taskStats.completionRate, language)}%`}
              isPositive={true}
              isLoading={tasksLoading}
              icon="wallet"
            />
            <CardStats
              title={t('dashboard.completed_tasks')}
              value={taskStats.completed.toString()}
              trend=""
              isPositive={true}
              isLoading={tasksLoading}
              icon="income"
            />
            <CardStats
              title={t('dashboard.in_progress_tasks')}
              value={taskStats.inProgress.toString()}
              trend=""
              isPositive={true}
              isLoading={tasksLoading}
              icon="income"
            />
            <CardStats
              title={t('dashboard.blocked_tasks')}
              value={taskStats.blocked.toString()}
              trend=""
              isPositive={false}
              isLoading={tasksLoading}
              icon="wallet"
            />
          </div>
        </div>
        
        <FloatingActionButton 
          onClick={() => setIsAddingNew(true)}
          label="Add Transaction"
          position="bottom-right"
        />
        
        {isAddingNew && (
          <TransactionModal
            onClose={() => setIsAddingNew(false)}
          />
        )}
      </div>
    );
};

const StatsGrid = ({ stats, isLoading, language }: { 
  stats: ReturnType<typeof calculateDashboardStats>, 
  isLoading: boolean,
  language: string 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* <CardStats
      title={t('dashboard.overview.total_balance')}
      value={formatCurrency(stats.totalBalance, language)}
      trend={`${formatNumber(Number(stats.balanceTrend), language)}%`}
      isPositive={Number(stats.balanceTrend) >= 0}
      isLoading={isLoading}
      icon="wallet"
    /> */}
     <CardStats
      title={t('dashboard.monthly_income')}
      value={`$${formatNumber(stats.currentIncome, language)}`}
      trend={`${formatNumber(Number(stats.incomeTrend), language)}%`}
      isPositive={Number(stats.incomeTrend) >= 0}
      isLoading={isLoading}
      icon="income"
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
      title={t('dashboard.net_balance')}
      value={`$${formatNumber(Number(stats.savingsRate), language)}`}
      trend={`${formatNumber(Number(stats.savingsTrend), language)}%`}
      isPositive={Number(stats.savingsTrend) >= 0}
      isLoading={isLoading}
      icon="savings"
    />
  </div>
);


