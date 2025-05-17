import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartData {
  month: string;
  income: number;
  expense: number;
}

interface OverviewChartProps {
  data: ChartData[];
}

export const OverviewChart = ({ data }: OverviewChartProps) => {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Income',
        data: data.map(d => d.income),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: window.innerWidth < 768 ? 2 : 3,
        pointHoverRadius: window.innerWidth < 768 ? 4 : 6,
      },
      {
        label: 'Expenses',
        data: data.map(d => d.expense),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: window.innerWidth < 768 ? 2 : 3,
        pointHoverRadius: window.innerWidth < 768 ? 4 : 6,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          title: (context: any) => {
            return `${context[0].label}`;
          },
          label: (context: any) => {
            const label = context.dataset.label;
            const value = context.parsed.y;
            return ` ${label}: $${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: '#F3F4F6',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          },
          callback: function (tickValue: string | number) {
            const num = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue);
            return `$${num.toLocaleString()}`;
          },
        },
        border: {
          dash: [5, 5],
        },
        beginAtZero: true,
      },
    },
    elements: {
      line: {
        borderWidth: 2,
        borderJoinStyle: 'round' as const,
        cubicInterpolationMode: 'monotone' as const,
      },
      point: {
        hitRadius: 8,
        hoverRadius: 6,
      },
    },
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md 
      transition-shadow duration-300 p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="space-y-0.5">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
            Monthly Overview
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Your financial activity for the past months
          </p>
        </div>
        <div className="flex items-center gap-4 bg-gray-50/70 dark:bg-gray-700/50 
          px-3 py-1.5 rounded-lg self-start backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-green-100 
              dark:ring-green-900/30"></div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-2 ring-red-100 
              dark:ring-red-900/30"></div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Expenses</span>
          </div>
        </div>
      </div>

      {/* Chart Stats Summary */}
      {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"> */}
        {/* {[
          {
            label: 'Total Income',
            value: data.reduce((sum, d) => sum + d.income, 0),
            trend: 'up',
            color: 'text-green-600 dark:text-green-400'
          },
          {
            label: 'Total Expenses',
            value: data.reduce((sum, d) => sum + d.expense, 0),
            trend: 'down',
            color: 'text-red-600 dark:text-red-400'
          },
          {
            label: 'Average Income',
            value: data.reduce((sum, d) => sum + d.income, 0) / data.length,
            color: 'text-blue-600 dark:text-blue-400'
          },
          {
            label: 'Average Expenses',
            value: data.reduce((sum, d) => sum + d.expense, 0) / data.length,
            color: 'text-purple-600 dark:text-purple-400'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className={`text-sm font-semibold ${stat.color}`}>
              ${stat.value.toLocaleString()}
              {stat.trend && (
                <span className="ml-1 text-xs">
                  {stat.trend === 'up' ? '↑' : '↓'}
                </span>
              )}
            </p>
          </div>
        ))}
      </div> */}

      <div className="h-[250px] sm:h-[350px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
