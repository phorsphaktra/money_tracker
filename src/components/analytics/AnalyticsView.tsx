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
    <div className="p-6 space-y-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-gray-500 mt-1">Overview for {selectedYear}</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm 
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: 'Total Income', 
            amount: totals.income, 
            color: 'emerald',
            icon: '💰'
          },
          { 
            label: 'Total Expenses', 
            amount: totals.expense, 
            color: 'rose',
            icon: '💸'
          },
          { 
            label: 'Net Balance', 
            amount: totals.income - totals.expense, 
            color: totals.income - totals.expense >= 0 ? 'blue' : 'amber',
            icon: '📊'
          }
        ].map(({ label, amount, color, icon }) => (
          <div key={label} 
            className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow
              border-l-4 border-${color}-500`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{icon}</span>
              <span className={`text-${color}-600 text-sm font-medium`}>{label}</span>
            </div>
            <p className={`text-3xl font-bold mt-4 text-${color}-600`}>
              ${Math.abs(amount).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Overview</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="flex items-center">
                <span className="w-3 h-3 bg-emerald-500 rounded-full mr-1"></span>
                Income
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 bg-rose-500 rounded-full mr-1"></span>
                Expenses
              </span>
            </div>
          </div>
          <OverviewChart data={monthlyData} />
        </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Income Distribution</h2>
            <CategoryChart
              categories={INCOME_CATEGORIES}
              categoryTotals={categoryTotals}
              type="income"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Expense Distribution</h2>
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
