import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { calculateSavingsBreakdown } from '../../../utils/savings';
import { useSaving } from '../../../contexts/SavingContext';
import { useMemo } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

export const SavingsBreakdown = () => {
  const { state: { savings } } = useSaving();
  
  const { totalSavings, categoryBreakdowns } = useMemo(() => {
    // Calculate total savings
    const total = savings.reduce((sum, s) => sum + s.amount, 0);
    
    // Calculate breakdowns based on total savings
    const breakdowns = calculateSavingsBreakdown(total);

    return {
      totalSavings: total,
      categoryBreakdowns: breakdowns
    };
  }, [savings]);

  const data = {
    labels: categoryBreakdowns.map(item => item.label),
    datasets: [{
      data: categoryBreakdowns.map(item => item.targetAmount),
      backgroundColor: categoryBreakdowns.map(item => item.color),
      borderWidth: 1,
      borderColor: '#ffffff'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const breakdown = categoryBreakdowns[context.dataIndex];
            return [
              `Target Amount: $${breakdown.targetAmount.toFixed(2)}`,
              `Current Amount: $${breakdown.actualAmount.toFixed(2)}`,
              `Progress: ${breakdown.progress.toFixed(1)}%`,
              `Target: ${breakdown.percentage}%`
            ];
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative h-[300px]">
        <Doughnut data={data} options={options} />
        {/* Center Stats */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalSavings.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Savings
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Category Cards */}
        {categoryBreakdowns.map(category => (
          <div key={category.id}
            className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all 
              border border-gray-100 dark:bg-gray-800 dark:border-gray-700"
            style={{ borderLeft: `4px solid ${category.color}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {category.label}
              </span>
              <span className="text-sm font-semibold px-2 py-1 rounded-full"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                {category.percentage}%
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                ${category.targetAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </div>
              <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${category.progress}%`,
                    backgroundColor: category.color
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Current: ${category.actualAmount.toFixed(2)}</span>
                <span>Progress: {category.progress.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
