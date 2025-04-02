import { useMemo } from 'react';
import { Transaction } from '../contexts/TransactionContext';
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
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '../utils/formatters';

// Register ChartJS components
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

interface SpendingChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export const SpendingChart = ({ transactions, isLoading }: SpendingChartProps) => {
  const chartData = useMemo(() => {
    const last6Months = new Array(6).fill(0).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
      };
    }).reverse();

    const monthlySpending = last6Months.map(({ month, year, monthIndex }) => {
      return transactions
        .filter(txn => {
          const txnDate = new Date(txn.date);
          return txnDate.getMonth() === monthIndex && 
                 txnDate.getFullYear() === year &&
                 txn.type === 'expense';
        })
        .reduce((sum, txn) => sum + txn.amount, 0);
    });

    const monthlyIncome = last6Months.map(({ month, year, monthIndex }) => {
      return transactions
        .filter(txn => {
          const txnDate = new Date(txn.date);
          return txnDate.getMonth() === monthIndex && 
                 txnDate.getFullYear() === year &&
                 txn.type === 'income';
        })
        .reduce((sum, txn) => sum + txn.amount, 0);
    });

    return {
      labels: last6Months.map(m => `${m.month} ${m.year}`),
      datasets: [
        {
          label: 'Income',
          data: monthlyIncome,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Spending',
          data: monthlySpending,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          }
        }
      },
      legend: {
        position: 'top' as const,
        align: 'end' as const
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => formatCurrency(value)
        },
        grid: {
          borderDash: [5, 5] as [number, number]
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse bg-gray-100 rounded flex items-center justify-center">
        <p className="text-gray-500">Loading chart...</p>
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <Line data={chartData} />
    </div>
  );
};
