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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-100 
        dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div className="p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex-shrink-0">
            <BanknotesIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Total Income</h3>
          </div>
        </div>
        <span className="text-sm sm:text-base lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white truncate block">
          {formatUSD(yearIncome)}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-100 
        dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div className="p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex-shrink-0">
            <ArrowTrendingDownIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Total Expenses</h3>
          </div>
        </div>
        <span className="text-sm sm:text-base lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white truncate block">
          {formatUSD(yearExpenses)}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-100 
        dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div className="p-2 sm:p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            <ArrowTrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Net Balance</h3>
          </div>
        </div>
        <span className={`text-sm sm:text-base lg:text-xl xl:text-2xl font-bold truncate block ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatUSD(netBalance)}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-100 
        dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div className="p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex-shrink-0">
            <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Net Savings</h3>
          </div>
        </div>
        <span className={`text-sm sm:text-base lg:text-xl xl:text-2xl font-bold truncate block ${netSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatUSD(netSavings)}
        </span>
      </div>
    </div>
  );
}; 