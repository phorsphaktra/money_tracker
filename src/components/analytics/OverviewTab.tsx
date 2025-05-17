import { OverviewChart } from './charts/OverviewChart';
import { CategoryChart } from './charts/CategoryChart';
import { SavingsBreakdown } from './charts/SavingsBreakdown';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../utils/categories';

interface OverviewTabProps {
  monthlyData: any[];
  categoryTotals: Record<string, number>;
  totals: { income: number; expense: number };
}

export const OverviewTab = ({ monthlyData, categoryTotals, totals }: OverviewTabProps) => (
  <div className="space-y-6 animate-fadeIn">
    {/* Financial Overview Card */}
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Income', value: totals.income, trend: 'up', color: 'emerald' },
          { label: 'Total Expenses', value: totals.expense, trend: 'down', color: 'rose' },
          { label: 'Net Balance', value: totals.income - totals.expense, trend: 'neutral', color: 'blue' },
          { label: 'Savings Rate', value: ((totals.income - totals.expense) / totals.income) * 100, isPercentage: true, color: 'indigo' }
        ].map(({ label, value, trend, color, isPercentage }) => (
          <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`text-lg font-semibold text-${color}-600 dark:text-${color}-400 mt-1`}>
              {isPercentage ? `${value.toFixed(1)}%` : `$${value.toLocaleString()}`}
              {trend && <span className="ml-1 text-sm">{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>}
            </p>
          </div>
        ))}
      </div>
    </div>

    {/* Charts Section */}
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6">
        <OverviewChart data={monthlyData} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Income Distribution
          </h2>
          <CategoryChart
            categories={INCOME_CATEGORIES}
            categoryTotals={categoryTotals}
            type="income"
          />
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Expense Breakdown
          </h2>
          <CategoryChart
            categories={EXPENSE_CATEGORIES}
            categoryTotals={categoryTotals}
            type="expense"
          />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Savings Analysis
        </h2>
        <SavingsBreakdown netIncome={totals.income - totals.expense} />
      </div>
    </div>
  </div>
);
