import { useMemo, useState, useEffect } from "react";
import { Transaction, useTransactions } from "../contexts/TransactionContext";
import { calculateDashboardStats } from "../utils/statsCalculator";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../contexts/LanguageContext";
import { FloatingActionButton } from "../components/shared/FloatingActionButton";
import { TransactionModal } from "../components/transaction/TransactionModal";
import { SpendingChart } from "../components/dashboard/SpendingChart";
import { TransactionCard } from "../components/transaction/TransactionCard";
import { useNavigate } from "react-router-dom";
import { useTaskContext } from "../contexts/TaskContext";
import { FinancialSummary } from "../components/dashboard/FinancialSummary";
import { MonthlyMetricsCard } from "../components/dashboard/MonthlyMetricsCard";
import { TaskStatsSection } from "../components/dashboard/TaskStatsSection";
import { calculateDetailedHealth } from "../utils/financialCalculations";
import { useSaving } from "../contexts/SavingContext";
import { ArrowTrendingUpIcon, PlusIcon, BanknotesIcon, WalletIcon } from "@heroicons/react/24/outline";
import { SavingForm } from "../components/saving/SavingForm";
import { formatUSD } from "../utils/currencyUtils";

const formatNumber = (num: number, language: string) => {
  if (language === "km") {
    const khmerNumerals = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
    return num
      .toLocaleString("en-US", { minimumFractionDigits: 2 })
      .replace(/[0-9]/g, (digit) => khmerNumerals[parseInt(digit)]);
  }
  return num.toLocaleString("en-US", { minimumFractionDigits: 2 });
};

const safeCalculateAverage = (transactions: Transaction[]): number => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return 0;
  }

  try {
    const expenses = transactions.filter(
      (t) =>
        t &&
        t.type === "expense" &&
        typeof t.amount === "number" &&
        !isNaN(t.amount)
    );

    if (expenses.length === 0) return 0;

    const total = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    return Math.max(0, total / 12); // Ensure non-negative
  } catch (error) {
    console.error("Error calculating average:", error);
    return 0;
  }
};

const calculateEnhancedStats = (
  transactions: Transaction[],
  baseStats: any
) => {
  try {
    const monthlyAverage = safeCalculateAverage(transactions);

    // Calculate categories for both income and expenses
    const categoryTotals = transactions.reduce((acc, curr) => {
      if (!curr || !curr.category || !curr.amount) return acc;
      const category = curr.category.trim() || "Uncategorized";
      const type = curr.type as 'income' | 'expense';
      if (!acc[type]) acc[type] = {};
      acc[type][category] = (acc[type][category] || 0) + Math.abs(curr.amount);
      return acc;
    }, {} as Record<'income' | 'expense', Record<string, number>>);

    // Calculate totals for each type
    const totals = {
      income: Object.values(categoryTotals.income || {}).reduce((a, b) => a + b, 0),
      expense: Object.values(categoryTotals.expense || {}).reduce((a, b) => a + b, 0)
    };

    // Create combined top categories array
    const topCategories = [
      ...Object.entries(categoryTotals.expense || {}).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totals.expense) * 100,
        type: 'expense' as const
      })),
      ...Object.entries(categoryTotals.income || {}).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totals.income) * 100,
        type: 'income' as const
      }))
    ].sort((a, b) => b.amount - a.amount);

    const currentIncome = Math.max(0, baseStats?.currentIncome || 0);
    const spendingTrend = baseStats?.spendingTrend || 0;
    const savingsRate = baseStats?.savingsRate || 0;

    const healthMetrics = calculateDetailedHealth(
      savingsRate,
      spendingTrend,
      monthlyAverage
    );

    return {
      ...baseStats,
      monthlyAverage,
      topCategories,
      hasIncreasedSpending: spendingTrend > 10,
      hasSavingsGoal: savingsRate > currentIncome * 0.2,
      financialHealth: healthMetrics.status,
      healthMessage: healthMetrics.message,
      healthDetails: healthMetrics.details,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error calculating enhanced stats:", error);
    return {
      ...baseStats,
      monthlyAverage: 0,
      topCategories: [],
      hasIncreasedSpending: false,
      hasSavingsGoal: false,
      financialHealth: "unknown",
      healthMessage: "Error calculating stats",
      healthDetails: null,
      lastUpdated: new Date().toISOString(),
    };
  }
};

const calculateMonthlyStats = (transactions: Transaction[]) => {
  const currentMonth = new Date().getMonth();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  const thisMonthTotal = transactions
    .filter((t) => new Date(t.date).getMonth() === currentMonth)
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const lastMonthTotal = transactions
    .filter((t) => new Date(t.date).getMonth() === lastMonth)
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const monthlyChange = lastMonthTotal
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    : 0;

  return {
    thisMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
    change: monthlyChange,
  };
};

const getMonthOptions = () => {
  const months = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, i, 1);
    months.push({
      value: i,
      label: date.toLocaleString("default", { month: "long" }),
    });
  }
  return months;
};

const filterTransactionsByMonth = (
  transactions: Transaction[],
  monthIndex: number
) => {
  const currentYear = new Date().getFullYear();
  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return (
      transactionDate.getMonth() === monthIndex &&
      transactionDate.getFullYear() === currentYear
    );
  });
};

const calculateMonthlyMetrics = (transactions: Transaction[]) => {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const spending = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  const netBalance = income - spending;

  return {
    income,
    spending,
    netBalance,
  };
};

const SavingsOverviewCard = ({ 
  savings, 
  monthlyMetrics, 
  formatNumber, 
  language, 
  t 
}: { 
  savings: any[], 
  monthlyMetrics: any,
  formatNumber: (num: number, language: string) => string,
  language: string,
  t: (key: string) => string 
}) => {
  const totalSavings = savings.reduce((acc, saving) => acc + saving.amount, 0);
  const monthlyIncome = monthlyMetrics.income || 0;
  const savingsRate = monthlyIncome > 0 ? (totalSavings / monthlyIncome) * 100 : 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {t("dashboard.overview.savings")}
          <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">{t("dashboard.savings_rate")}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(savingsRate, language)}%
          </p>
        </div> */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">{t("dashboard.overview.savings")}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(totalSavings, language)}
          </p>
        </div>
      </div>

      {savings.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t("dashboard.recent_savings")}
          </h4>
          <div className="space-y-3">
            {savings.slice(0, 3).map((saving) => (
              <div 
                key={saving.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {saving.description || t("savings.no_description")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(saving.date).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {formatUSD(saving.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ActionMenu = ({ 
  isOpen, 
  onClose, 
  onAddTransaction, 
  onAddSaving,
  t 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onAddTransaction: () => void;
  onAddSaving: () => void;
  t: (key: string) => string;
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed right-4 bottom-20 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden min-w-[200px]">
        <div className="p-2 space-y-1">
          <button
            onClick={() => {
              onAddTransaction();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
          >
            <BanknotesIcon className="w-5 h-5 text-indigo-500" />
            {t("transaction.addNew")}
          </button>
          
          <button
            onClick={() => {
              onAddSaving();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
          >
            <WalletIcon className="w-5 h-5 text-green-500" />
            {t("savings.add_new")}
          </button>
        </div>
      </div>
    </>
  );
};

export const DashboardScreen = () => {
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { state: savingState, loadSavings, addSaving } = useSaving();
  const { tasks, loading: tasksLoading } = useTaskContext();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isAddingSaving, setIsAddingSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const monthOptions = useMemo(() => getMonthOptions(), []);

  useEffect(() => {
    loadSavings();
  }, [loadSavings]);

  const filteredTransactionsByMonth = useMemo(
    () => filterTransactionsByMonth(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  const stats = useMemo(
    () => calculateDashboardStats(filteredTransactionsByMonth),
    [filteredTransactionsByMonth]
  );

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      blocked,
      completionRate,
    };
  }, [tasks]);

  const enhancedStats = useMemo(
    () => calculateEnhancedStats(filteredTransactionsByMonth, stats),
    [stats, filteredTransactionsByMonth]
  );

  const monthlyStats = useMemo(
    () => calculateMonthlyStats(filteredTransactionsByMonth),
    [filteredTransactionsByMonth]
  );

  const monthlyMetrics = useMemo(
    () => calculateMonthlyMetrics(filteredTransactionsByMonth),
    [filteredTransactionsByMonth]
  );

  const recentTransactions = useMemo(() => {
    return filteredTransactionsByMonth
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [filteredTransactionsByMonth]);

  const handleViewAll = () => {
    navigate("/transactions", {
      state: { selectedMonth },
    });
  };

  if (transactionsLoading || tasksLoading || savingState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-6">
            {/* Loading skeletons */}
            <div className="h-32 bg-white dark:bg-gray-800 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
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
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {t("dashboard.title")}
              </h1>
              <p className="text-sm text-indigo-100 mt-1 max-w-lg">
                {t("dashboard.subtitle")}
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full sm:w-auto px-4 py-2 text-sm border-0 rounded-xl 
                  bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 
                  focus:ring-2 focus:ring-white/50 transition-all duration-200"
              >
                {monthOptions.map((month) => (
                  <option 
                    key={month.value} 
                    value={month.value} 
                    className="text-gray-900 dark:text-gray-100"
                  >
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <MonthlyMetricsCard
          monthLabel={monthOptions[selectedMonth].label}
          metrics={monthlyMetrics}
          formatNumber={formatNumber}
          language={language}
          t={t}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {t("dashboard.spending_overview")}
                <span className="text-sm font-normal text-gray-500">
                  {monthOptions[selectedMonth].label}
                </span>
              </h3>
            </div>
            <SpendingChart
              transactions={filteredTransactionsByMonth}
              isLoading={transactionsLoading}
            />
          </div>

          <SavingsOverviewCard
            savings={savingState.savings}
            monthlyMetrics={monthlyMetrics}
            formatNumber={formatNumber}
            language={language}
            t={t}
          />
        </div>

        <FinancialSummary
          enhancedStats={enhancedStats}
          monthlyStats={monthlyStats}
          language={language}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          formatNumber={formatNumber}
          t={t}
          topCategories={enhancedStats.topCategories}
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("dashboard.overview.recent_transactions")}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {monthOptions[selectedMonth].label}
              </span>
            </h3>
            <button
              onClick={handleViewAll}
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
            >
              {t("dashboard.overview.view_all")}
            </button>
          </div>
          <div className="overflow-hidden space-y-2">
            {recentTransactions.map((transaction, index) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                index={index}
              />
            ))}
            {recentTransactions.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                {t("dashboard.no_transactions_month", {
                  month: monthOptions[selectedMonth].label,
                })}
              </p>
            )}
          </div>
        </div>

        <TaskStatsSection
          stats={taskStats}
          isLoading={tasksLoading}
          formatNumber={formatNumber}
          language={language}
          t={t}
        />

        <FloatingActionButton
          onClick={() => setIsMenuOpen(true)}
          label={t("common.add")}
          position="bottom-right"
          icon={<PlusIcon className="w-6 h-6" />}
        />

        <ActionMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onAddTransaction={() => setIsAddingTransaction(true)}
          onAddSaving={() => setIsAddingSaving(true)}
          t={t}
        />

        {isAddingTransaction && (
          <TransactionModal onClose={() => setIsAddingTransaction(false)} />
        )}

        {isAddingSaving && (
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {t("savings.add_new")}
              </h2>
              <SavingForm
                onSubmit={async (saving) => {
                  try {
                    await addSaving(saving);
                    setIsAddingSaving(false);
                    loadSavings(); // Refresh savings list
                  } catch (error) {
                    console.error("Failed to add saving:", error);
                  }
                }}
                onCancel={() => setIsAddingSaving(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
