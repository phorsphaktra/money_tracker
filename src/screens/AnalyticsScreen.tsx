import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { 
  calculateTotalsByType, 
  getMonthlyData, 
  getCategoryTotals,
  getAvailableYears,
  filterTransactionsByYear 
} from '../utils/analytics';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories';
import { OverviewChart } from '../components/analytics/charts/OverviewChart';
import { CategoryChart } from '../components/analytics/charts/CategoryChart';
import { SavingsBreakdown } from '../components/analytics/charts/SavingsBreakdown';

export const AnalyticsView = () => {
  const { transactions } = useTransactions();
  const availableYears = getAvailableYears(transactions);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const filteredTransactions = filterTransactionsByYear(transactions, selectedYear);
  const totals = calculateTotalsByType(filteredTransactions);
  const monthlyData = getMonthlyData(transactions, selectedYear);
  const categoryTotals = getCategoryTotals(filteredTransactions);

  // Calculate additional financial metrics
  const financialSummary = useMemo(() => {
    const monthlyIncome = totals.income / 12;
    const monthlyExpense = totals.expense / 12;
    const savingsRate = ((totals.income - totals.expense) / totals.income) * 100;
    const expenseRatio = (totals.expense / totals.income) * 100;
    
    // Get top spending categories
    const topExpenses = Object.entries(categoryTotals)
      .filter(([_, amount]) => amount < 0)
      .map(([category, amount]) => ({
        category,
        amount: Math.abs(amount),
        percentage: (Math.abs(amount) / totals.expense) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    // Calculate month-over-month changes
    const monthlyChanges = monthlyData.reduce((acc, curr, idx, arr) => {
      if (idx === 0) return acc;
      const prevMonth = arr[idx - 1];
      const expenseChange = ((curr.expense - prevMonth.expense) / prevMonth.expense) * 100;
      const incomeChange = ((curr.income - prevMonth.income) / prevMonth.income) * 100;
      
      acc.push({
        month: curr.month,
        expenseChange,
        incomeChange
      });
      return acc;
    }, [] as Array<{month: string; expenseChange: number; incomeChange: number}>);

    // Add health score calculation
    const healthScore = {
      score: Math.min(100, Math.max(0, (savingsRate * 0.4) + ((1 - expenseRatio) * 60))),
      status: savingsRate >= 20 && expenseRatio < 0.7 ? 'healthy' : 'needs-attention'
    };

    return {
      monthly: {
        income: monthlyIncome,
        expense: monthlyExpense,
        savings: monthlyIncome - monthlyExpense
      },
      metrics: {
        savingsRate,
        expenseRatio,
        monthlyChanges: monthlyChanges.slice(-3), // Last 3 months
        topExpenses
      },
      insights: {
        hasSufficientSavings: savingsRate >= 20,
        hasHighExpenses: (totals.expense / totals.income) > 0.7,
        isImproving: monthlyChanges[monthlyChanges.length - 1]?.expenseChange < 0
      },
      healthScore
    };
  }, [totals, categoryTotals, monthlyData]);

  const yearlyAnalysis = useMemo(() => {
    // Calculate year-over-year changes
    const prevYearTransactions = filterTransactionsByYear(transactions, selectedYear - 1);
    const prevYearTotals = calculateTotalsByType(prevYearTransactions);
    
    // Yearly comparisons
    const yearOverYearChange = {
      income: ((totals.income - prevYearTotals.income) / prevYearTotals.income) * 100,
      expense: ((totals.expense - prevYearTotals.expense) / prevYearTotals.expense) * 100,
      savings: ((totals.income - totals.expense) - (prevYearTotals.income - prevYearTotals.expense)) / 
               Math.abs(prevYearTotals.income - prevYearTotals.expense) * 100
    };

    // Quarterly breakdown
    const quarterlyData = monthlyData.reduce((acc, month, index) => {
      const quarter = Math.floor(index / 3);
      if (!acc[quarter]) {
        acc[quarter] = { income: 0, expense: 0, savings: 0 };
      }
      acc[quarter].income += month.income;
      acc[quarter].expense += month.expense;
      acc[quarter].savings += (month.income - month.expense);
      return acc;
    }, {} as Record<number, { income: number; expense: number; savings: number }>);

    return {
      yearOverYearChange,
      quarterlyData,
      annualMetrics: {
        totalTransactions: filteredTransactions.length,
        avgMonthlyIncome: totals.income / 12,
        avgMonthlyExpense: totals.expense / 12,
        avgMonthlySavings: (totals.income - totals.expense) / 12,
        savingsRate: ((totals.income - totals.expense) / totals.income) * 100,
        expenseToIncomeRatio: (totals.expense / totals.income) * 100
      }
    };
  }, [transactions, selectedYear, totals, monthlyData, filteredTransactions]);

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl 
          shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="bg-indigo-50 dark:bg-indigo-900/50 p-1.5 rounded-lg">📈</span>
            Monthly Overview
          </h2>
          <OverviewChart data={monthlyData} />
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl 
          shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="bg-indigo-50 dark:bg-indigo-900/50 p-1.5 rounded-lg">💎</span>
            Savings Strategy
          </h2>
          <SavingsBreakdown netIncome={totals.income - totals.expense} />
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl 
          shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="bg-indigo-50 dark:bg-indigo-900/50 p-1.5 rounded-lg">💫</span>
            Income Distribution
          </h2>
          <CategoryChart
            categories={INCOME_CATEGORIES}
            categoryTotals={categoryTotals}
            type="income"
          />
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl 
          shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="bg-indigo-50 dark:bg-indigo-900/50 p-1.5 rounded-lg">🎯</span>
            Expense Breakdown
          </h2>
          <CategoryChart
            categories={EXPENSE_CATEGORIES}
            categoryTotals={categoryTotals}
            type="expense"
          />
        </div>
      </div>
    </div>
  );

  const renderDetailsTab = () => (
    <div className="space-y-6">
      {/* Yearly Performance Summary */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <span className="bg-indigo-50 dark:bg-indigo-900/50 p-2 rounded-lg">📅</span>
          Yearly Performance {selectedYear}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Year over Year Changes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500">Year over Year Changes</h3>
            <div className="space-y-2">
              {Object.entries(yearlyAnalysis.yearOverYearChange).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{key}</span>
                  <span className={`text-sm font-medium ${
                    value > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {value > 0 ? '+' : ''}{value.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quarterly Overview */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500">Quarterly Overview</h3>
            <div className="space-y-2">
              {Object.entries(yearlyAnalysis.quarterlyData).map(([quarter, data]) => (
                <div key={quarter} className="flex justify-between items-center">
                  <span className="text-sm">Q{Number(quarter) + 1}</span>
                  <span className="text-sm font-medium">
                    ${Math.abs(data.savings).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Annual Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500">Annual Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Savings Rate</span>
                <span className={`text-sm font-medium ${
                  yearlyAnalysis.annualMetrics.savingsRate >= 20 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                }`}>
                  {yearlyAnalysis.annualMetrics.savingsRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Expense Ratio</span>
                <span className="text-sm font-medium">
                  {yearlyAnalysis.annualMetrics.expenseToIncomeRatio.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Transactions</span>
                <span className="text-sm font-medium">
                  {yearlyAnalysis.annualMetrics.totalTransactions}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Income & Expense Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Income Sources Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl 
          shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 
          dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg">💰</span>
              Top Income Sources
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedYear}
            </span>
          </div>
          <div className="space-y-4">
            {Object.entries(
              filteredTransactions
                .filter(t => t.type === 'income')
                .reduce((acc, t) => {
                  const category = t.category || 'Other';
                  acc[category] = (acc[category] || 0) + (t.amount || 0);
                  return acc;
                }, {} as Record<string, number>)
            )
              .sort(([_, a], [__, b]) => b - a)
              .slice(0, 5)
              .map(([category, amount]) => {
                const percentage = (amount / totals.income) * 100;
                return (
                  <div key={category} className="space-y-2 group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {category}
                      </span>
                      <div className="text-right">
                        <span className="text-sm text-emerald-600 dark:text-emerald-400">
                          ${amount.toLocaleString()}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(percentage)}% of income
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 
                          rounded-full transition-all duration-500 group-hover:from-emerald-600 group-hover:to-emerald-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Top Expenses Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl 
          shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 
          dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="bg-rose-50 dark:bg-rose-900/30 p-2 rounded-lg">💸</span>
              Top Expenses
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedYear}
            </span>
          </div>
          <div className="space-y-4">
            {Object.entries(
              filteredTransactions
                .filter(t => t.type === 'expense')
                .reduce((acc, t) => {
                  const category = t.category || 'Other';
                  acc[category] = (acc[category] || 0) + Math.abs(t.amount || 0);
                  return acc;
                }, {} as Record<string, number>)
            )
              .sort(([_, a], [__, b]) => b - a)
              .slice(0, 5)
              .map(([category, amount]) => {
                const percentage = (amount / Math.abs(totals.expense)) * 100;
                return (
                  <div key={category} className="space-y-2 group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {category}
                      </span>
                      <div className="text-right">
                        <span className="text-sm text-rose-600 dark:text-rose-400">
                          ${amount.toLocaleString()}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(percentage)}% of expenses
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 to-rose-400 
                          rounded-full transition-all duration-500 group-hover:from-rose-600 group-hover:to-rose-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Financial Health Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Monthly Overview Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Monthly Overview
          </h3>
          <div className="space-y-3">
            {Object.entries(financialSummary.monthly).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm capitalize">{key}</span>
                <span className={`font-medium ${
                  key === 'savings' 
                    ? value >= 0 ? 'text-green-600' : 'text-red-600'
                    : ''
                }`}>
                  ${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Insights Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🎯</span> Financial Insights
          </h3>
          <div className="space-y-3">
            {[
              {
                label: 'Savings Rate',
                value: `${financialSummary.metrics.savingsRate.toFixed(1)}%`,
                status: financialSummary.insights.hasSufficientSavings ? 'good' : 'warning'
              },
              {
                label: 'Monthly Trend',
                value: financialSummary.insights.isImproving ? 'Improving' : 'Need Attention',
                status: financialSummary.insights.isImproving ? 'good' : 'warning'
              },
              {
                label: 'Expense Ratio',
                value: `${financialSummary.metrics.expenseRatio.toFixed(1)}%`,
                status: !financialSummary.insights.hasHighExpenses ? 'good' : 'warning'
              }
            ].map(({ label, value, status }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  status === 'good' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Enhanced Header with Health Score */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 
          shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Financial Analytics
                </h1>
                <p className="text-sm text-indigo-100 mt-1">
                  Comprehensive overview for {selectedYear}
                </p>
              </div>
              
              <div className="flex items-center gap-4 w-full lg:w-auto">
                {/* Health Score Indicator */}
                <div className="flex-1 lg:flex-none bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle
                          className="text-gray-300/20"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="transparent"
                          r="20"
                          cx="24"
                          cy="24"
                        />
                        <circle
                          className="text-white"
                          strokeWidth="4"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="20"
                          cx="24"
                          cy="24"
                          strokeDasharray={125.6}
                          strokeDashoffset={125.6 * (1 - (financialSummary.healthScore.score / 100))}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {Math.round(financialSummary.healthScore.score)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Financial Health</p>
                      <p className="text-sm font-medium text-white">
                        {financialSummary.healthScore.status === 'healthy' ? 'Healthy' : 'Needs Attention'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Year Selector with Enhanced Styling */}
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-3 text-sm border-0 rounded-xl bg-white/10 text-white 
                    backdrop-blur-sm hover:bg-white/20 focus:ring-2 focus:ring-white/50 
                    transition-all duration-200"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year} className="text-gray-900">
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-white/20">
              {(['overview', 'details'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg
                    ${activeTab === tab 
                      ? 'text-white border-b-2 border-white' 
                      : 'text-white/60 hover:text-white/80'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' ? renderOverviewTab() : renderDetailsTab()}
      </div>
    </div>
  );
};
