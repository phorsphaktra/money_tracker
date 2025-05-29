import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { Transaction, useTransactions } from '../contexts/TransactionContext';
import { useSaving } from '../contexts/SavingContext';
import { useTaskContext } from '../contexts/TaskContext';
import { calculateDashboardStats } from '../utils/statsCalculator';
import { calculateDetailedHealth } from '../utils/financialCalculations';
import { formatUSD } from '../utils/currencyUtils';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  WalletIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Helper Functions
const formatNumber = (num: number, language: string) => {
  if (language === 'km') {
    const khmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return num.toLocaleString('en-US', { minimumFractionDigits: 2 })
      .replace(/[0-9]/g, digit => khmerNumerals[parseInt(digit)]);
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 2 });
};

const calculateGrowthRate = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Dashboard Components
const DashboardHeader = ({ title, subtitle, period }: { title: string; subtitle: string; period: string }) => (
  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 shadow-lg">
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
        <p className="text-sm text-indigo-100 mt-2">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
        <CalendarIcon className="w-5 h-5 text-white/70" />
        <span className="text-sm text-white">{period}</span>
      </div>
    </div>
  </div>
);

const MetricCard = ({ 
  title, 
  value, 
  trend, 
  icon: Icon,
  type = 'neutral',
  subtitle,
  loading = false
}: { 
  title: string;
  value: string;
  trend?: { value: number; label: string };
  icon: React.ElementType;
  type?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  loading?: boolean;
}) => {
  const colors = {
    positive: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    negative: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    neutral: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-lg ${colors[type]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {trend && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type]}`}>
            {trend.value >= 0 ? '↑' : '↓'} {trend.label}
          </div>
        )}
      </div>
    </div>
  );
};

const TransactionList = ({ 
  transactions, 
  title,
  onViewAll 
}: { 
  transactions: Transaction[];
  title: string;
  onViewAll: () => void;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <button
        onClick={onViewAll}
        className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 
          dark:hover:text-indigo-300 font-medium"
      >
        View All
      </button>
    </div>
    <div className="space-y-4">
      {transactions.map(transaction => (
        <div 
          key={transaction.id}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {transaction.description}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(transaction.date).toLocaleDateString()}
            </p>
          </div>
          <div className={`text-sm font-semibold ${
            transaction.type === 'income' 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {transaction.type === 'income' ? '+' : '-'}{formatUSD(Math.abs(transaction.amount))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TaskOverview = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <MetricCard
      title="Completed Tasks"
      value={stats.completed.toString()}
      icon={CheckCircleIcon}
      type="positive"
      trend={{ value: stats.completionRate, label: `${stats.completionRate.toFixed(1)}%` }}
    />
    <MetricCard
      title="In Progress"
      value={stats.inProgress.toString()}
      icon={ClockIcon}
      type="neutral"
    />
    <MetricCard
      title="Blocked Tasks"
      value={stats.blocked.toString()}
      icon={ExclamationCircleIcon}
      type="negative"
    />
  </div>
);

const SpendingAnalysis = ({ 
  transactions,
  t 
}: { 
  transactions: Transaction[];
  t: (key: string) => string;
}) => {
  const categories = useMemo(() => {
    const categoryMap = transactions.reduce((acc, curr) => {
      if (!curr.category) return acc;
      const category = curr.category.trim();
      if (!acc[category]) {
        acc[category] = { amount: 0, count: 0 };
      }
      acc[category].amount += Math.abs(curr.amount);
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    return Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: (data.amount / transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <ChartPieIcon className="w-6 h-6 text-indigo-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('dashboard.spending_analysis')}
        </h3>
      </div>
      <div className="space-y-4">
        {categories.slice(0, 5).map(category => (
          <div key={category.category} className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category.category}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  ({category.count} transactions)
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatUSD(category.amount)}
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full"
                style={{ width: `${category.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SavingsProgress = ({
  savings,
  income,
  t
}: {
  savings: Array<{ date: string; amount: number }>;
  income: number;
  t: (key: string) => string;
}) => {
  const monthlySavings = useMemo(() => {
    const monthlyData = savings.reduce((acc, curr) => {
      const month = new Date(curr.date).getMonth();
      if (!acc[month]) acc[month] = 0;
      acc[month] += curr.amount;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({
        month: new Date(2024, parseInt(month)).toLocaleString('default', { month: 'short' }),
        amount: amount as number
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [savings]);

  const savingsRate = (savings.reduce((sum, s) => sum + s.amount, 0) / income) * 100;
  const targetRate = 20; // Example target savings rate

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('dashboard.savings_progress')}
        </h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {t('dashboard.savings_rate')}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {savingsRate.toFixed(1)}% / {targetRate}%
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (savingsRate / targetRate) * 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {monthlySavings.map(data => (
            <div key={data.month} className="flex flex-col items-center">
              <div 
                className="bg-green-100 dark:bg-green-900/20 rounded w-full"
                style={{ height: `${(data.amount / Math.max(...monthlySavings.map(d => d.amount))) * 100}px` }}
              />
              <span className="text-xs text-gray-500 mt-1">{data.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TaskAnalytics = ({ stats }: { stats: any }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
    <div className="flex items-center gap-3 mb-6">
      <ArrowPathIcon className="w-6 h-6 text-indigo-500" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Task Analytics
      </h3>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard
        title="Completed Tasks"
        value={stats.completed.toString()}
        icon={CheckCircleIcon}
        type="positive"
        trend={{ value: stats.completionRate, label: `${stats.completionRate.toFixed(1)}%` }}
        subtitle="Overall completion rate"
      />
      <MetricCard
        title="In Progress"
        value={stats.inProgress.toString()}
        icon={ClockIcon}
        type="neutral"
        subtitle="Tasks being worked on"
      />
      <MetricCard
        title="Blocked Tasks"
        value={stats.blocked.toString()}
        icon={ExclamationCircleIcon}
        type="negative"
        subtitle="Requires attention"
      />
    </div>

    <div className="mt-6">
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg h-4 flex overflow-hidden">
        <div 
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${(stats.completed / stats.total) * 100}%` }}
        />
        <div 
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
        />
        <div 
          className="bg-red-500 transition-all duration-500"
          style={{ width: `${(stats.blocked / stats.total) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{((stats.completed / stats.total) * 100).toFixed(1)}% Complete</span>
        <span>{((stats.inProgress / stats.total) * 100).toFixed(1)}% In Progress</span>
        <span>{((stats.blocked / stats.total) * 100).toFixed(1)}% Blocked</span>
      </div>
    </div>
  </div>
);

const FinancialOverview = ({ 
  transactions, 
  savings,
  t 
}: { 
  transactions: Transaction[];
  savings: any[];
  t: (key: string) => string;
}) => {
  const currentMonth = new Date().getMonth();
  const currentMonthTransactions = transactions.filter(
    t => new Date(t.date).getMonth() === currentMonth
  );
  const previousMonthTransactions = transactions.filter(
    t => new Date(t.date).getMonth() === (currentMonth - 1 + 12) % 12
  );

  const currentIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const previousIncome = previousMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const previousExpenses = previousMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);
  const previousMonthSavings = savings
    .filter(s => new Date(s.date).getMonth() === (currentMonth - 1 + 12) % 12)
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard
        title={t('dashboard.monthly_income')}
        value={formatUSD(currentIncome)}
        icon={BanknotesIcon}
        type="positive"
        trend={{
          value: calculateGrowthRate(currentIncome, previousIncome),
          label: `vs last month`
        }}
        subtitle={`Previous: ${formatUSD(previousIncome)}`}
      />
      <MetricCard
        title={t('dashboard.monthly_expenses')}
        value={formatUSD(currentExpenses)}
        icon={ArrowTrendingDownIcon}
        type="negative"
        trend={{
          value: -calculateGrowthRate(currentExpenses, previousExpenses),
          label: `vs last month`
        }}
        subtitle={`Previous: ${formatUSD(previousExpenses)}`}
      />
      <MetricCard
        title={t('dashboard.total_savings')}
        value={formatUSD(totalSavings)}
        icon={ArrowTrendingUpIcon}
        type="positive"
        trend={{
          value: calculateGrowthRate(totalSavings, previousMonthSavings),
          label: `vs last month`
        }}
        subtitle={`Target: ${formatUSD(currentIncome * 0.2)}`}
      />
    </div>
  );
};

export const DashboardScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { state: savingState, loadSavings } = useSaving();
  const { tasks, loading: tasksLoading } = useTaskContext();

  useEffect(() => {
    loadSavings();
  }, [loadSavings]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, inProgress, blocked, completionRate };
  }, [tasks]);

  const currentMonthIncome = useMemo(() => {
    const currentMonth = new Date().getMonth();
    return transactions
      .filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  if (transactionsLoading || tasksLoading || savingState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-white dark:bg-gray-800 rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <DashboardHeader
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
          period={new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        />

        <FinancialOverview
          transactions={transactions}
          savings={savingState.savings}
          t={t}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingAnalysis
            transactions={transactions}
            t={t}
          />
          <SavingsProgress
            savings={savingState.savings}
            income={currentMonthIncome}
            t={t}
          />
        </div>

        <TaskAnalytics stats={taskStats} />
      </div>
    </div>
  );
};
