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
        fill: false,
        tension: 0.4,
        order: 1,
        borderWidth: 2,
        pointRadius: 4
      },
      {
        type: 'line' as const,
        label: 'Expenses',
        data: data.map(d => d.expense),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.4,
        order: 1,
        borderWidth: 2,
        pointRadius: 4
      }
    ]
  };

  return (
    <div className="space-y-4">
      <div className="h-[300px]">
        <Chart type="bar" data={chartData}/>
      </div>
    </div>
  );
};
