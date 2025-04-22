import { useState, useEffect } from 'react';
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
  
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const filteredTransactions = filterTransactionsByYear(transactions, selectedYear);
  const totals = calculateTotalsByType(filteredTransactions);
  const monthlyData = getMonthlyData(transactions, selectedYear);
  const categoryTotals = getCategoryTotals(filteredTransactions);

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                Financial Analytics
              </h1>
              <p className="text-sm text-indigo-100">
                Comprehensive overview for {selectedYear}
              </p>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-xl border
                border-white/20 text-white focus:ring-2 focus:ring-white/30
                focus:border-transparent transition-all cursor-pointer hover:bg-white/20
                text-sm font-medium"
            >
              {availableYears.map(year => (
                <option key={year} value={year} className="text-gray-900">{year}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { label: 'Total Income', amount: totals.income, icon: '💰', trend: '+', 
                color: 'from-emerald-400/30', shadowColor: 'shadow-emerald-500/20' },
              { label: 'Total Expenses', amount: totals.expense, icon: '💸', trend: '-', 
                color: 'from-rose-400/30', shadowColor: 'shadow-rose-500/20' },
              { label: 'Net Balance', amount: totals.income - totals.expense, icon: '📊',
                trend: totals.income - totals.expense >= 0 ? '+' : '-',
                color: totals.income - totals.expense >= 0 ? 'from-sky-400/30' : 'from-amber-400/30',
                shadowColor: totals.income - totals.expense >= 0 ? 'shadow-sky-500/20' : 'shadow-amber-500/20' }
            ].map(({ label, amount, icon, trend, color, shadowColor }) => (
              <div key={label} 
                className={`bg-gradient-to-br ${color} to-transparent backdrop-blur-xl rounded-xl p-5
                  hover:scale-102 transition-all duration-300 border border-white/20 cursor-pointer
                  shadow-md ${shadowColor} group`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
                  <span className="text-xs font-medium text-white/90">{label}</span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold tracking-tight">
                    {trend}{Math.abs(amount).toLocaleString('en-US', { 
                      style: 'currency', 
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-6 hover:shadow-xl 
          transition-all duration-300 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-indigo-50 p-1.5 rounded-lg text-base">📈</span>
            Monthly Overview
          </h2>
          <OverviewChart data={monthlyData} />
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-6 hover:shadow-xl 
          transition-all duration-300 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-indigo-50 p-1.5 rounded-lg text-base">💎</span>
            Savings Strategy
          </h2>
          <SavingsBreakdown netIncome={totals.income - totals.expense} />
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-6 hover:shadow-xl 
          transition-all duration-300 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-indigo-50 p-1.5 rounded-lg text-base">💫</span>
            Income Distribution
          </h2>
          <CategoryChart
            categories={INCOME_CATEGORIES}
            categoryTotals={categoryTotals}
            type="income"
          />
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-6 hover:shadow-xl 
          transition-all duration-300 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-indigo-50 p-1.5 rounded-lg text-base">🎯</span>
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
};
