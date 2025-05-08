import { useMemo, useState } from "react";
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
import { FinancialSummary } from '../components/dashboard/FinancialSummary';
import { MonthlyMetricsCard } from '../components/dashboard/MonthlyMetricsCard';
import { TaskStatsSection } from '../components/dashboard/TaskStatsSection';

const formatNumber = (num: number, language: string) => {
  if (language === "km") {
    const khmerNumerals = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
    return num
      .toLocaleString("en-US", { minimumFractionDigits: 2 })
      .replace(/[0-9]/g, (digit) => khmerNumerals[parseInt(digit)]);
  }
  return num.toLocaleString("en-US", { minimumFractionDigits: 2 });
};

interface FinancialHealth {
  status: "excellent" | "good" | "warning" | "needs-attention" | "unknown";
  message: string;
}

const calculateFinancialHealth = (
  savingsRate: number,
  spendingTrend: number
): FinancialHealth => {
  if (!isFinite(savingsRate) || !isFinite(spendingTrend)) {
    return { status: "unknown", message: "Invalid data" };
  }

  if (savingsRate > 30 && spendingTrend < 0) {
    return {
      status: "excellent",
      message: "Excellent savings and controlled spending",
    };
  }
  if (savingsRate > 0) {
    return { status: "good", message: "Positive savings rate" };
  }
  if (savingsRate === 0) {
    return { status: "warning", message: "No savings accumulated" };
  }
  return { status: "needs-attention", message: "Negative savings rate" };
};

const calculateFinancialScore = (stats: any): number => {
  const savingsScore =
    (stats.savingsRate > 0 ? 40 : 0) * Math.min(stats.savingsRate / 30, 1);
  const spendingScore = Math.max(
    0,
    30 * (1 - Math.max(stats.spendingTrend, 0) / 100)
  );
  const incomeScore = Math.max(
    0,
    30 * (1 + Math.min(stats.incomeTrend, 100) / 100)
  );
  return Math.min(100, Math.round(savingsScore + spendingScore + incomeScore));
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

    // Calculate spending categories only for expenses
    const categoryTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        if (!curr || !curr.category || !curr.amount) return acc;
        const category = curr.category.trim() || "Uncategorized";
        acc[category] = (acc[category] || 0) + Math.abs(curr.amount);
        return acc;
      }, {} as Record<string, number>);

    const totalSpending = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    // Calculate top categories with percentages
    const topCategories = Object.entries(categoryTotals)
      .filter(([category]) => category && category !== "Uncategorized")
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpending) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const currentIncome = Math.max(0, baseStats?.currentIncome || 0);
    const spendingTrend = baseStats?.spendingTrend || 0;
    const savingsRate = baseStats?.savingsRate || 0;

    const health = calculateFinancialHealth(savingsRate, spendingTrend);

    return {
      ...baseStats,
      monthlyAverage,
      topCategories,
      hasIncreasedSpending: spendingTrend > 10,
      hasSavingsGoal: savingsRate > currentIncome * 0.2,
      financialHealth: health.status,
      healthMessage: health.message,
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
      lastUpdated: new Date().toISOString(),
    };
  }
};

const calculateMonthlyStats = (transactions: Transaction[]) => {
  const currentMonth = new Date().getMonth();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  
  const thisMonthTotal = transactions
    .filter(t => new Date(t.date).getMonth() === currentMonth)
    .reduce((acc, t) => acc + (t.amount || 0), 0);
    
  const lastMonthTotal = transactions
    .filter(t => new Date(t.date).getMonth() === lastMonth)
    .reduce((acc, t) => acc + (t.amount || 0), 0);
    
  const monthlyChange = lastMonthTotal ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
  
  return {
    thisMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
    change: monthlyChange
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
      label: date.toLocaleString('default', { month: 'long' })
    });
  }
  return months;
};

const filterTransactionsByMonth = (transactions: Transaction[], monthIndex: number) => {
  const currentYear = new Date().getFullYear();
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === monthIndex && 
           transactionDate.getFullYear() === currentYear;
  });
};

const calculateMonthlyMetrics = (transactions: Transaction[]) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const spending = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  const netBalance = income - spending;

  return {
    income,
    spending,
    netBalance
  };
};

export const DashboardScreen = () => {
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { tasks, loading: tasksLoading } = useTaskContext();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const monthOptions = useMemo(() => getMonthOptions(), []);

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

  const monthlyStats = useMemo(() => 
    calculateMonthlyStats(filteredTransactionsByMonth),
    [filteredTransactionsByMonth]
  );

  const monthlyMetrics = useMemo(() => 
    calculateMonthlyMetrics(filteredTransactionsByMonth),
    [filteredTransactionsByMonth]
  );

  const recentTransactions = useMemo(() => {
    return filteredTransactionsByMonth
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [filteredTransactionsByMonth]);

  const handleViewAll = () => {
    navigate("/transactions", { 
      state: { selectedMonth } 
    });
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
      <header>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t("dashboard.title")}
          </h1>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-sm border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        
        <FinancialSummary
          enhancedStats={enhancedStats}
          monthlyStats={monthlyStats}
          language={language}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          formatNumber={formatNumber}
          t={t}
          calculateFinancialScore={calculateFinancialScore}
          topCategories={enhancedStats.topCategories}
        />
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
                {t("dashboard.no_transactions_month", { month: monthOptions[selectedMonth].label })}
              </p>
            )}
          </div>
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
        onClick={() => setIsAddingNew(true)}
        label={t("dashboard.add_transaction")}
        position="bottom-right"
      />

      {isAddingNew && (
        <TransactionModal onClose={() => setIsAddingNew(false)} />
      )}
    </div>
  );
};
