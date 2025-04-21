import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { CategoryType } from '../../../utils/categories';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryChartProps {
  categories: CategoryType[];
  categoryTotals: Record<string, number>;
  type: 'income' | 'expense';
}

export const CategoryChart = ({ categories, categoryTotals }: CategoryChartProps) => {
  const activeCategories = categories.filter(cat => categoryTotals[cat.id] > 0);
  const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const data = {
    labels: activeCategories.map(cat => cat.label),
    datasets: [
      {
        data: activeCategories.map(cat => categoryTotals[cat.id] || 0),
        backgroundColor: activeCategories.map(cat => cat.chartColor),
        borderWidth: 1,
        borderColor: '#ffffff'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11 },
          generateLabels: (chart: any) => {
            const dataset = chart.data.datasets[0];
            return chart.data.labels.map((label: string, i: number) => ({
              text: `${label} (${((dataset.data[i] / total) * 100).toFixed(1)}%)`,
              fillStyle: dataset.backgroundColor[i],
              strokeStyle: '#ffffff',
              lineWidth: 2,
              hidden: false,
              index: i
            }));
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const percentage = ((value / total) * 100).toFixed(1);
            return [
              `Amount: $${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
              `Percentage: ${percentage}%`
            ];
          }
        }
      }
    }
  };

  return (
    <div className="h-[300px] relative">
      {activeCategories.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          No data available
        </div>
      ) : (
        <Pie data={data} options={options} />
      )}
    </div>
  );
};
