import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { formatUSD } from '../../utils/currencyUtils';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  netBalance: number;
}

interface MonthlyTrendsChartProps {
  data: MonthlyData[];
}

export const MonthlyTrendsChart = ({ data }: MonthlyTrendsChartProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
        <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 flex-shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Monthly Trends</h3>
      </div>

      <div className="h-[300px] sm:h-[350px] lg:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              fontSize={12}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              fontSize={12}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatUSD(value).replace('$', '')}
            />
            <Tooltip 
              formatter={(value: number) => formatUSD(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px'
              }}
              labelStyle={{
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            />
            <Legend 
              wrapperStyle={{
                fontSize: '12px',
                paddingTop: '10px'
              }}
            />
            <Bar dataKey="income" name="Income" fill="#10B981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[2, 2, 0, 0]} />
            <Bar dataKey="savings" name="Savings" fill="#6366F1" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 