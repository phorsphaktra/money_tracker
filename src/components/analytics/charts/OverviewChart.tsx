import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
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

  const netSavings = data.map(d => d.income - d.expense);

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Net Savings',
        data: netSavings,
        backgroundColor: '#3B82F6',
        borderRadius: 4,
        order: 2
      },
      {
        type: 'line' as const,
        label: 'Income',
        data: data.map(d => d.income),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
<<<<<<< HEAD
        fill: false,
        tension: 0.4,
        order: 1,
        borderWidth: 2,
        pointRadius: 4
=======
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: window.innerWidth < 768 ? 2 : 3,
        pointHoverRadius: window.innerWidth < 768 ? 4 : 6,
>>>>>>> prod
      },
      {
        type: 'line' as const,
        label: 'Expenses',
        data: data.map(d => d.expense),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
<<<<<<< HEAD
        fill: false,
        tension: 0.4,
        order: 1,
        borderWidth: 2,
        pointRadius: 4
=======
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: window.innerWidth < 768 ? 2 : 3,
        pointHoverRadius: window.innerWidth < 768 ? 4 : 6,
>>>>>>> prod
      }
    ]
  };

  return (
<<<<<<< HEAD
    <div className="space-y-4">
      <div className="h-[300px]">
        <Chart type="bar" data={chartData}/>
=======
    <div className="w-full bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-4 sm:p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="space-y-0.5">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Monthly Overview</h3>
          <p className="text-xs sm:text-sm text-gray-500">Your financial activity for the past months</p>
        </div>
        <div className="flex items-center gap-4 bg-gray-50/70 px-3 py-1.5 rounded-lg self-start">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-green-100"></div>
            <span className="text-xs font-medium text-gray-600">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-2 ring-red-100"></div>
            <span className="text-xs font-medium text-gray-600">Expenses</span>
          </div>
        </div>
      </div>
      <div className="h-[250px] sm:h-[350px]">
        <Line data={chartData} />
>>>>>>> prod
      </div>
    </div>
  );
};
