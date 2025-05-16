import React from 'react';
import { 
  WalletIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

type CardStatsProps = {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  isLoading?: boolean;
  icon?: 'wallet' | 'spending' | 'income' | 'savings';
};

const icons = {
  wallet: WalletIcon,
  spending: ChartBarIcon,
  income: BanknotesIcon,
  savings: ArrowTrendingUpIcon,
};

export const CardStats: React.FC<CardStatsProps> = ({
  title,
  value,
  trend,
  isPositive,
  isLoading,
  icon
}) => {
  const Icon = icon ? icons[icon] : WalletIcon;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          isPositive 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {isPositive ? '↑' : '↓'} {trend}
        </span>
      </div>
    </div>
  );
};
