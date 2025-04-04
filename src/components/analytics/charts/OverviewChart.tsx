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
        tension: 0.4
      },
      {
        label: 'Expenses',
        data: data.map(d => d.expense),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
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
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context: any) => 
            `${context.dataset.label}: $${context.raw.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          callback: (tickValue: string | number) => 
            `$${Number(tickValue).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
          font: { size: 11 }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-gray-800">Monthly Overview</h3>
          <p className="text-sm text-gray-500">Your financial activity for the past months</p>
        </div>
        <div className="flex items-center gap-6 bg-gray-50 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#22C55E] ring-4 ring-green-100"></div>
            <span className="text-sm font-medium text-gray-700">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EF4444] ring-4 ring-red-100"></div>
            <span className="text-sm font-medium text-gray-700">Expenses</span>
          </div>
        </div>
      </div>
      <div className="h-[400px] w-full">
        <Line 
          data={chartData} 
          options={{
            ...options,
            plugins: {
              ...options.plugins,
              tooltip: {
                ...options.plugins.tooltip,
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                padding: 16,
                cornerRadius: 8,
                displayColors: false,
              }
            }
          }}
        />
      </div>
    </div>
  );
};
