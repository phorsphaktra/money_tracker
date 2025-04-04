import { useState, useEffect } from 'react';
import { useTransactions } from '../../contexts/TransactionContext';
import { 
  calculateTotalsByType, 
  getMonthlyData, 
  getCategoryTotals,
  getAvailableYears,
  filterTransactionsByYear 
} from '../../utils/analytics';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';
import { OverviewChart } from './charts/OverviewChart';
import { CategoryChart } from './charts/CategoryChart';
import { SavingsBreakdown } from './charts/SavingsBreakdown';

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
    <div className="p-6 space-y-8 max-w-7xl mx-auto min-h-screen">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Financial Analytics</h1>
            <p className="mt-2 opacity-90">Overview for {selectedYear}</p>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border 
              border-white/20 text-white focus:ring-2 focus:ring-white/50 
              focus:border-transparent transition-all"
          >
            {availableYears.map(year => (
              <option key={year} value={year} className="text-gray-900">{year}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {[
            { label: 'Total Income', amount: totals.income, icon: '💰', trend: '+' },
            { label: 'Total Expenses', amount: totals.expense, icon: '💸', trend: '-' },
            { label: 'Net Balance', amount: totals.income - totals.expense, icon: '📊', 
              trend: totals.income - totals.expense >= 0 ? '+' : '-' }
          ].map(({ label, amount, icon, trend }) => (
            <div key={label} 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 
                transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium opacity-90">{label}</span>
              </div>
              <div className="mt-4 flex items-baseline">
                <p className="text-2xl font-bold">
                  {trend}{Math.abs(amount).toFixed(2)}$
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Monthly Overview</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-600">Income</span>
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <span className="text-gray-600">Expenses</span>
              </span>
            </div>
          </div>
          <OverviewChart data={monthlyData} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Savings Allocation</h2>
          <SavingsBreakdown netIncome={totals.income - totals.expense} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Income Sources</h2>
          <CategoryChart
            categories={INCOME_CATEGORIES}
            categoryTotals={categoryTotals}
            type="income"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Expense Categories</h2>
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
