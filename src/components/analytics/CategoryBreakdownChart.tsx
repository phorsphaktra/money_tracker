import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { formatUSD } from '../../utils/currencyUtils';
import { CategoryId } from '../../utils/categories';
import { PieLabelRenderProps } from 'recharts';

interface CategoryBreakdown {
  category: CategoryId;
  label: string;
  amount: number;
  percentage: number;
  count: number;
}

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[];
  title: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Custom label renderer for inside pie slices
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: PieLabelRenderProps & { name: string }) => {
  const RADIAN = Math.PI / 180;
  // Provide default values for undefined props
  const safeCx = typeof cx === 'number' ? cx : 0;
  const safeCy = typeof cy === 'number' ? cy : 0;
  const safeInnerRadius = typeof innerRadius === 'number' ? innerRadius : 0;
  const safeOuterRadius = typeof outerRadius === 'number' ? outerRadius : 0;
  // Calculate label position
  const radius = safeInnerRadius + (safeOuterRadius - safeInnerRadius) * 0.5;
  const x = safeCx + radius * Math.cos(-midAngle * RADIAN);
  const y = safeCy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
      style={{ pointerEvents: 'none' }}
    >
      {`${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  );
};

export const CategoryBreakdownChart = ({ data, title }: CategoryBreakdownChartProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <ChartPieIcon className="w-6 h-6 text-indigo-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>

      <div className="h-[480px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={200}
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatUSD(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 