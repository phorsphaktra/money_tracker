import {
  BanknotesIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import { formatUSD } from '../../utils/currencyUtils';

interface SummaryCardsProps {
  yearIncome: number;
  yearExpenses: number;
  yearSavings: number;
  netBalance: number;
  netSavings: number;
  monthlyBurnRate: number;
}

export const SummaryCards = ({
  yearIncome,
  yearExpenses,
  netBalance,
  netSavings}: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 
        dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
            <BanknotesIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Income</h3>
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatUSD(yearIncome)}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 
        dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            <ArrowTrendingDownIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Expenses</h3>
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatUSD(yearExpenses)}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 
        dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
            <ArrowTrendingUpIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Balance</h3>
        </div>
        <span className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatUSD(netBalance)}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 
        dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <WalletIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Savings</h3>
        </div>
        <span className={`text-2xl font-bold ${netSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatUSD(netSavings)}
        </span>
      </div>
    </div>
  );
}; 