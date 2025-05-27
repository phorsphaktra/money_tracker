import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { SAVINGS_CATEGORIES, calculateSavingsBreakdown } from '../../../utils/savings';
import { useSaving } from '../../../contexts/SavingContext';
import { useMemo } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

export const SavingsBreakdown = () => {
  const { state: { savings } } = useSaving();
  
  // Calculate total savings and net income
  const { totalSavings, monthlyNetIncome } = useMemo(() => {
    const total = savings.reduce((sum, s) => sum + s.amount, 0);
    // Assuming monthly net income is total savings divided by average savings rate (40%)
    // This gives us a reasonable estimate of the net income needed to achieve these savings
    const estimatedMonthlyIncome = total / 0.4;
    
    return {
      totalSavings: total,
      monthlyNetIncome: estimatedMonthlyIncome
    };
  }, [savings]);

  const savingsData = calculateSavingsBreakdown(monthlyNetIncome);
  
  const data = {
    labels: savingsData.map(item => item.label),
    datasets: [{
      data: savingsData.map(item => item.amount),
      backgroundColor: savingsData.map(item => item.color),
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
            const value = context.raw;
            const percentage = SAVINGS_CATEGORIES[context.dataIndex].percentage;
            return [
              `Amount: $${value.toFixed(2)}`,
              `Percentage: ${percentage}%`
            ];
          }
        }
      }
    }
  };

  const savingsRate = (totalSavings / monthlyNetIncome) * 100;

  return (
    <div className="space-y-6">
      <div className="relative h-[300px]">
        <Doughnut data={data} options={options} />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div 
          className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all 
            border border-gray-100"
          style={{ borderLeft: `4px solid #3B82F6` }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Savings</span>
            <span className="text-sm font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: `#3B82F620`, color: '#3B82F6' }}>
              100%
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            ${monthlyNetIncome.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          </div>
        </div>

        {/* <div 
          className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all 
            border border-gray-100"
          style={{ borderLeft: `4px solid #22C55E` }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Savings</span>
            <span className="text-sm font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: `#22C55E20`, color: '#22C55E' }}>
              {savingsRate.toFixed(1)}%
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            ${totalSavings.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          </div>
        </div> */}

        {savingsData.map(item => (
          <div key={item.id} 
            className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all 
              border border-gray-100"
            style={{ borderLeft: `4px solid ${item.color}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className="text-sm font-semibold px-2 py-1 rounded-full" 
                style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                {item.percentage}%
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              ${item.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
