import React, { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Transaction, useTransactions } from '../contexts/TransactionContext';
import { useSaving } from '../contexts/SavingContext';
import { useTaskContext } from '../contexts/TaskContext';
import { formatUSD } from '../utils/currencyUtils';
import { TransactionModal } from '../components/transaction/TransactionModal';
import { SavingForm } from '../components/saving/SavingForm';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  ScaleIcon,
  WalletIcon} from '@heroicons/react/24/outline';
import { t } from 'i18next';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { CardGroup } from '../components/analytics/CardGroup';
import { SummaryCards } from '../components/analytics/SummaryCards';
import { MonthlyTrendsChart } from '../components/analytics/MonthlyTrendsChart';
import { CategoryBreakdownChart } from '../components/analytics/CategoryBreakdownChart';
import { SavingsTypeMetricsCard } from '../components/analytics/SavingsTypeMetricsCard';

// Helper Functions


  const monthKeys = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

// Dashboard Components
const DashboardHeader = ({ 
  title, 
  subtitle, 
  selectedMonth,
  onMonthChange 
}: { 
  title: string; 
  subtitle: string; 
  period: string;
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const months = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const month = monthKeys[date.getMonth()];
    const year = date.getFullYear();
      return {
        value: date,
        // label: date.toLocaleString('default', { month: 'long', year: 'numeric' })
        label: `${t(`date.${month}`)} ${year}`
      };
    });
  }, []);
    
  return (
    <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 
      rounded-2xl p-6 md:p-8 shadow-lg 
      hover:shadow-xl hover:from-indigo-500 hover:to-purple-500 
      transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
          <p className="text-sm text-indigo-100 mt-2">{subtitle}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg 
              hover:bg-white/20 transition-colors duration-200"
          >
            <CalendarIcon className="w-5 h-5 text-white/70" />
            <span className="text-sm text-white">
              {t(`date.${monthKeys[selectedMonth.getMonth()]}`)} {selectedMonth.getFullYear()}

            </span>
            <ChevronDownIcon className={`w-4 h-4 text-white/70 transition-transform duration-200
              ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 
                shadow-lg ring-1 ring-black/5 z-40 py-1 max-h-96 overflow-auto">
                {months.map((month) => (
                  <button
                    key={month.value.toISOString()}
                    onClick={() => {
                      onMonthChange(month.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 
                      dark:hover:bg-gray-700 transition-colors duration-200
                      ${month.value.getMonth() === selectedMonth.getMonth() &&
                      month.value.getFullYear() === selectedMonth.getFullYear()
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {month.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 
      border border-gray-100 dark:border-gray-700 
      hover:shadow-lg hover:-translate-y-1 
      transition-all duration-300 ease-out">
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

type SpendingAnalysisProps = {
  transactions: Transaction[];
  t: (key: string) => string;
  type: 'expense' | 'income';
};

const SpendingAnalysis = ({ 
  transactions, 
  t, 
  type 
}: SpendingAnalysisProps) => {
  const categories = useMemo(() => {
    const filteredTransactions = transactions.filter(tx => tx.type === type);

    const categoryMap = filteredTransactions.reduce((acc, curr) => {
      if (!curr.category) return acc;
      const category = curr.category.trim();
      if (!acc[category]) {
        acc[category] = { amount: 0, count: 0 };
      } 
      acc[category].amount += Math.abs(curr.amount);
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    const totalAmount = filteredTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );

    return Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, type]);

    const titleKey =
    type === 'expense'
      ? 'dashboard.monthly_expenses'
      : 'dashboard.monthly_income';
      
    return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:border-indigo-100 dark:hover:border-indigo-900/30">
      <div className="flex items-center gap-3 mb-6">
        <ChartPieIcon className="w-6 h-6 text-indigo-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t(titleKey)}
        </h3>
      </div>
      <div className="space-y-4">
        {categories.slice(0, 5).map(category => (
          <div key={category.category} 
            className="space-y-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 
              transition-colors duration-200">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category.category.charAt(0).toUpperCase() + category.category.slice(1).toLowerCase()}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  ({category.count} {t('dashboard.transactions')})
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


const FloatingActionButton = ({ onAddTransaction, onAddSaving }: {
  onAddTransaction: () => void;
  onAddSaving: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed lg:bottom-8 lg:right-20 md:bottom-2 md:right-6 bottom-4 right-4 
        flex flex-col items-end space-y-4 z-50">
        {/* FAB Menu Items */}
        <div className={`flex flex-col items-end space-y-3 transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        >
          {/* Transaction Button */}
          <button
            onClick={() => {
              setIsOpen(false);
              onAddTransaction();
            }}
            className="group flex items-center gap-2 pl-4 pr-3 py-2 
              bg-gradient-to-r from-indigo-500 to-indigo-600 
              text-white rounded-full shadow-lg hover:shadow-indigo-500/25 
              hover:translate-x-0 translate-x-12 transition-all duration-300
              md:translate-x-12 sm:translate-x-16 xs:translate-x-8
              md:hover:translate-x-0 sm:hover:translate-x-0"
          >
            <span className="text-xs sm:text-sm md:text-sm font-medium whitespace-nowrap
              max-w-0 sm:max-w-none overflow-hidden transition-all duration-300">
              {t('dashboard.add_transaction')}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full 
              bg-indigo-500 flex items-center justify-center 
              shadow-inner group-hover:scale-110 transition-transform">
              <BanknotesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
          </button>
          
          {/* Saving Button */}
          <button
            onClick={() => {
              setIsOpen(false);
              onAddSaving();
            }}
            className="group flex items-center gap-2 pl-4 pr-3 py-2 
              bg-gradient-to-r from-emerald-500 to-emerald-600 
              text-white rounded-full shadow-lg hover:shadow-emerald-500/25 
              hover:translate-x-0 translate-x-12 transition-all duration-300
              md:translate-x-12 sm:translate-x-16 xs:translate-x-8
              md:hover:translate-x-0 sm:hover:translate-x-0"
          >
            <span className="text-xs sm:text-sm md:text-sm font-medium whitespace-nowrap
              max-w-0 sm:max-w-none overflow-hidden transition-all duration-300">
              {t('dashboard.add_saving')}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full 
              bg-emerald-500 flex items-center justify-center 
              shadow-inner group-hover:scale-110 transition-transform">
              <CurrencyDollarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
          </button>
        </div>
        
        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative rounded-full shadow-lg 
            transition-all duration-300 ease-in-out transform
            w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
            ${isOpen 
              ? 'bg-gray-700 hover:bg-gray-600 rotate-45 scale-110' 
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-110'
            }`}
        >
          {/* Background Glow Effect */}
          <div className={`absolute inset-0 rounded-full transition-opacity duration-300
            bg-gradient-to-r from-indigo-500 to-purple-600 blur-lg -z-10 opacity-50
            group-hover:opacity-75 hidden sm:block`} 
          />

          {/* Icon Container */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isOpen ? (
              <XMarkIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white 
                transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <PlusIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white 
                transition-transform duration-300 group-hover:scale-110" />
            )}
          </div>

          {/* Ripple Effect */}
          <div className={`absolute inset-0 rounded-full transition-transform duration-500
            bg-white opacity-0 group-hover:opacity-25 group-hover:scale-150`} 
          />
        </button>

        {/* Safe Area Indicator for Mobile */}
        <div className="h-safe-area w-full block sm:hidden" />
      </div>
    </>
  );
};

// SavingsSummary card for the selected month (copied and adapted from AnalyticsScreen)

export const DashboardScreen = () => {
  const { t } = useTranslation();
  const { transactions, loadTransactions } = useTransactions();
  const { state: savingState, loadSavings } = useSaving();
  const { tasks, loading: tasksLoading } = useTaskContext();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showSavingForm, setShowSavingForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isRefetching, setIsRefetching] = useState(false);
  const {
    netSavings,
    monthlyData,
    isLoading: analyticsLoading
  } = useAnalytics();

  useEffect(() => {
    loadSavings();
  }, [loadSavings]);

  // Improved: refetch data when month changes
  const handleMonthChange = async (date: Date) => {
    setIsRefetching(true);
    setSelectedMonth(date);
    try {
      await loadSavings();
      await loadTransactions();
    } finally {
      setIsRefetching(false);
    }
  };

  const handleAddTransaction = () => {
    setShowTransactionModal(true);
  };

  const handleAddSaving = () => {
    setShowSavingForm(true);
  };

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, inProgress, blocked, completionRate };
  }, [tasks]);

  // Filter transactions and savings based on selected month
  const filteredData = useMemo(() => {
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= startOfMonth && date <= endOfMonth;
    });

    const filteredSavings = savingState.savings.filter(s => {
      const date = new Date(s.date);
      return date >= startOfMonth && date <= endOfMonth;
    });

    // Calculate previous month data for comparison
    const prevMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1);
    const startOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
    const endOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);

    const prevMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= startOfPrevMonth && date <= endOfPrevMonth;
    });

    const prevMonthSavings = savingState.savings.filter(s => {
      const date = new Date(s.date);
      return date >= startOfPrevMonth && date <= endOfPrevMonth;
    });

    return {
      current: {
        transactions: filteredTransactions,
        savings: filteredSavings
      },
      previous: {
        transactions: prevMonthTransactions,
        savings: prevMonthSavings
      }
    };
  }, [transactions, savingState.savings, selectedMonth]);

  // Get previous month analytics for trends
  const currentMonthIndex = selectedMonth.getMonth();
  const currentMonthData = monthlyData[currentMonthIndex] || {};

  // Calculate savings summary for the selected month

  const getCategoryBreakdown = (type: 'expense' | 'income') => {
    const txs = filteredData.current.transactions.filter(t => t.type === type);
    const categoryMap = txs.reduce((acc, curr) => {
      if (!curr.category) return acc;
      if (!acc[curr.category]) {
        acc[curr.category] = { amount: 0, count: 0, label: curr.category };
      }
      acc[curr.category].amount += Math.abs(curr.amount);
      acc[curr.category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number; label: string }>);
    const totalAmount = Object.values(categoryMap).reduce((sum, { amount }) => sum + amount, 0);
    return Object.entries(categoryMap).map(([category, data]) => ({
      category,
      label: category,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      count: data.count,
    })).sort((a, b) => b.amount - a.amount);
  };
  const monthExpenseCategories = useMemo(() => getCategoryBreakdown('expense'), [filteredData.current.transactions]);
  const monthIncomeCategories = useMemo(() => getCategoryBreakdown('income'), [filteredData.current.transactions]);

  if (analyticsLoading || tasksLoading || savingState.isLoading || isRefetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <LoadingSpinner size="large" className="text-indigo-600" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Month Selector and KPI Cards */}
        <DashboardHeader
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
          period={selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
        />
        <CardGroup
          title={t('dashboard.summary')}
          icon={BanknotesIcon}
          defaultExpanded={true}
          accentColor="from-blue-500 to-indigo-500"
        >
          <div className="overflow-x-auto">
            <SummaryCards
              yearIncome={currentMonthData.income || 0}
              yearExpenses={currentMonthData.expenses || 0}
              yearSavings={currentMonthData.savings || 0}
              netBalance={currentMonthData.netBalance || 0}
              netSavings={netSavings}
              monthlyBurnRate={currentMonthData.expenses || 0}
            />
          </div>
        </CardGroup>

        {/* Monthly Trends Chart */}
        <CardGroup
          title={t('dashboard.monthly_trends')}
          icon={ChartPieIcon}
          defaultExpanded={true}
          accentColor="from-purple-500 to-purple-600"
        >
          <div className="overflow-x-auto min-w-[320px]">
            <MonthlyTrendsChart data={monthlyData} />
          </div>
        </CardGroup>

        {/* Category Breakdown Charts */}
        <CardGroup
          title={t('dashboard.category_breakdown')}
          icon={WalletIcon}
          defaultExpanded={true}
          accentColor="from-green-500 to-green-600"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="overflow-x-auto min-w-[280px]">
              <CategoryBreakdownChart
                data={monthExpenseCategories}
                title={t('dashboard.expense_categories')}
              />
            </div>
            <div className="overflow-x-auto min-w-[280px]">
              <CategoryBreakdownChart
                data={monthIncomeCategories}
                title={t('dashboard.income_categories')}
              />
            </div>
          </div>
        </CardGroup>

        {/* Savings Chart (Bar/Donut) */}
        <CardGroup
          title={t('savings.analysis')}
          icon={ScaleIcon}
          defaultExpanded={true}
          accentColor="from-green-500 to-emerald-500"
        >
          <div className="overflow-x-auto min-w-[320px]">
            <SavingsTypeMetricsCard savings={filteredData.current.savings} />
          </div>
        </CardGroup>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="overflow-x-auto min-w-[280px]">
            <SpendingAnalysis
              transactions={filteredData.current.transactions}
              t={t}
              type="income"
            />
          </div>
          <div className="overflow-x-auto min-w-[280px]">
            <SpendingAnalysis
              transactions={filteredData.current.transactions}
              t={t}
              type="expense"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-w-[320px]">
          <TaskAnalytics stats={taskStats} />
        </div>

        {/* Floating Action Button */}
        <div className="pb-[env(safe-area-inset-bottom)] md:pb-0">
          <FloatingActionButton
            onAddTransaction={handleAddTransaction}
            onAddSaving={handleAddSaving}
          />
        </div>

        {/* Transaction Modal */}
        {showTransactionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
            <div className="w-full max-w-lg mx-auto">
              <TransactionModal
                onClose={() => setShowTransactionModal(false)}
              />
            </div>
          </div>
        )}

        {/* Saving Form */}
        {showSavingForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 mx-auto">
              <SavingForm
                onSubmit={async () => {
                    await loadSavings();
                  setShowSavingForm(false);
                }}
                onCancel={() => setShowSavingForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
