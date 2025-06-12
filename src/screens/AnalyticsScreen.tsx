import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartPieIcon,
  CalendarIcon,
  ChevronDownIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ScaleIcon,
  WalletIcon,
  PlusIcon,
  XMarkIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useTransactions, Transaction } from '../contexts/TransactionContext';
import { useSaving } from '../contexts/SavingContext';
import { formatUSD } from '../utils/currencyUtils';
import { CategoryId, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories';
import { Saving } from '../services/savingService';
import { SAVINGS_CATEGORIES } from '../utils/savings';
import { TransactionModal } from '../components/transaction/TransactionModal';
import { SavingForm } from '../components/saving/SavingForm';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

interface SavingData extends Saving {}

interface CardGroupProps {
  title: string;
  icon: React.ElementType;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}

const CardGroup: React.FC<CardGroupProps> = ({
  title,
  icon: Icon,
  defaultExpanded = true,
  children,
  className = '',
  accentColor = 'from-indigo-500 to-indigo-600'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`space-y-4 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${accentColor}
          rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 text-white">
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>
        </div>
        <div className={`p-2 rounded-full bg-white/10 text-white transition-transform duration-300
          ${isExpanded ? 'rotate-180' : ''} group-hover:bg-white/20`}>
          <ChevronDownIcon className="w-4 h-4" />
        </div>
      </button>
      
      <div className={`transition-all duration-500 ease-in-out space-y-4
        ${isExpanded 
          ? 'opacity-100 max-h-[2000px] transform translate-y-0' 
          : 'opacity-0 max-h-0 overflow-hidden transform -translate-y-4'}`}>
        {children}
      </div>
    </div>
  );
};

const AnalyticsHeader = ({ 
  selectedYear,
  onYearChange 
}: { 
  selectedYear: number;
  onYearChange: (year: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('analytics.title')}</h1>
          <p className="text-sm text-indigo-100 mt-2">{t('analytics.subtitle')}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg 
              hover:bg-white/20 transition-colors duration-200"
          >
            <CalendarIcon className="w-5 h-5 text-white/70" />
            <span className="text-sm text-white">{selectedYear}</span>
            <ChevronDownIcon className={`w-4 h-4 text-white/70 transition-transform duration-200
              ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
              <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-gray-800 
                shadow-lg ring-1 ring-black/5 z-40 py-1">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      onYearChange(year);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 
                      dark:hover:bg-gray-700 transition-colors duration-200
                      ${year === selectedYear
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const YearSummary = ({ transactions, savings }: { 
  transactions: Transaction[];
  savings: SavingData[];
}) => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

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
          {formatUSD(totalIncome)}
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
          {formatUSD(totalExpenses)}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 
        dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
            <ArrowTrendingUpIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Savings</h3>
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatUSD(totalSavings)}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 
        dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
            <ChartPieIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Savings Rate</h3>
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {savingsRate.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

const MonthlyTrends = ({ transactions, savings }: {
  transactions: Transaction[];
  savings: SavingData[];
}) => {
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(i);
      return date.toLocaleString('default', { month: 'short' });
    });

    const data = months.map((month, index) => {
      const monthTransactions = transactions.filter(t => 
        new Date(t.date).getMonth() === index
      );

      const monthSavings = savings.filter(s => 
        new Date(s.date).getMonth() === index
      );

      return {
        month,
        income: monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        expenses: monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        savings: monthSavings
          .filter(s => s.type === 'credit')
          .reduce((sum, s) => sum + s.amount, 0)
      };
    });

    return data;
  }, [transactions, savings]);

  const maxValue = Math.max(
    ...monthlyData.map(d => Math.max(d.income, d.expenses, d.savings))
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <ChartBarIcon className="w-6 h-6 text-indigo-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Trends</h3>
      </div>

      <div className="mt-6 space-y-8">
        <div className="relative h-64">
          {monthlyData.map((data, i) => (
            <div key={data.month} className="absolute bottom-0" style={{ left: `${(i / 11) * 100}%` }}>
              <div className="flex flex-col items-center gap-1">
                <div className="relative w-12 flex flex-col items-center">
                  <div 
                    className="w-2 bg-green-500 rounded-t"
                    style={{ height: `${(data.income / maxValue) * 200}px` }}
                  />
                  <div 
                    className="w-2 bg-red-500 rounded-t mt-1"
                    style={{ height: `${(data.expenses / maxValue) * 200}px` }}
                  />
                  <div 
                    className="w-2 bg-indigo-500 rounded-t mt-1"
                    style={{ height: `${(data.savings / maxValue) * 200}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500 -rotate-45 origin-top-left mt-2">
                  {data.month}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Savings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryBreakdown = ({ transactions, type }: {
  transactions: Transaction[];
  type: 'income' | 'expense';
}) => {
  const categories = useMemo(() => {
    const categoryMap = transactions
      .filter(t => t.type === type)
      .reduce((acc, curr) => {
        if (!curr.category) return acc;
        if (!acc[curr.category]) {
          acc[curr.category] = { amount: 0, count: 0 };
        }
        acc[curr.category].amount += Math.abs(curr.amount);
        acc[curr.category].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

    const totalAmount = Object.values(categoryMap)
      .reduce((sum, { amount }) => sum + amount, 0);

    return Object.entries(categoryMap)
      .map(([id, data]) => ({
        id: id as CategoryId,
        label: (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
          .find(c => c.id === id)?.label || id,
        amount: data.amount,
        count: data.count,
        percentage: (data.amount / totalAmount) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, type]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <ChartPieIcon className="w-6 h-6 text-indigo-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {type === 'income' ? 'Income' : 'Expense'} Categories
        </h3>
      </div>

      <div className="space-y-4">
        {categories.map(category => (
          <div key={category.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category.label}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  ({category.count} transactions)
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatUSD(category.amount)}
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  type === 'income' ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${category.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SavingsAnalysis = ({ savings, income }: {
  savings: SavingData[];
  income: number;
}) => {
  const { state: savingState } = useSaving();

  const savingsMetrics = useMemo(() => {
    const { summary } = savingState;
    const totalSavings = summary.credits;
    const totalWithdrawals = summary.debits;
    
    // Calculate Savings Rate
    const savingsRate = income > 0 ? (totalSavings / income) * 100 : 0;
    const averageSaving = savings.length > 0 ? totalSavings / savings.length : 0;
    
    // Calculate breakdown by month
    const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = new Date(new Date().getFullYear(), monthIndex, 1);
      const monthEnd = new Date(new Date().getFullYear(), monthIndex + 1, 0);

      const monthSavings = savings.filter(s => {
        const date = new Date(s.date);
        return date >= monthStart && date <= monthEnd;
      });

      return {
        month: monthStart.toLocaleString('default', { month: 'short' }),
        credit: monthSavings
          .filter(s => s.type === 'credit')
          .reduce((sum, s) => sum + s.amount, 0),
        debit: monthSavings
          .filter(s => s.type === 'debit')
          .reduce((sum, s) => sum + Math.abs(s.amount), 0),
        count: monthSavings.length,
        net: monthSavings.reduce((sum, s) => 
          sum + (s.type === 'credit' ? s.amount : -s.amount), 0)
      };
    });

    // Calculate growth rates
    const monthlyGrowth = monthlyData.map((data, index, array) => {
      if (index === 0) return 0;
      const prevNet = array[index - 1].net;
      const currentNet = data.net;
      return prevNet === 0 ? 0 : ((currentNet - prevNet) / Math.abs(prevNet)) * 100;
    });

    const averageGrowth = monthlyGrowth.length > 0
      ? monthlyGrowth.reduce((sum, growth) => sum + growth, 0) / monthlyGrowth.length
      : 0;

    return {
      totalSavings,
      totalWithdrawals,
      netSavings: totalSavings - totalWithdrawals,
      savingsRate,
      averageSaving,
      averageGrowth,
      monthlyData,
      transactionCounts: {
        credits: summary.creditCount,
        debits: summary.debitCount,
        total: summary.creditCount + summary.debitCount
      }
    };
  }, [savings, income, savingState.summary]);

  const maxAmount = Math.max(
    ...savingsMetrics.monthlyData.map(d => Math.max(d.credit, Math.abs(d.debit)))
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 
          dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 
              text-purple-600 dark:text-purple-400">
              <WalletIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Average Saving
            </h3>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatUSD(savingsMetrics.averageSaving)}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 
          dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 
              text-blue-600 dark:text-blue-400">
              <ScaleIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Savings Rate
            </h3>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {savingsMetrics.savingsRate.toFixed(1)}%
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 
          dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 
              text-green-600 dark:text-green-400">
              <ArrowTrendingUpIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Average Growth
            </h3>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {savingsMetrics.averageGrowth.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 
        dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-6 h-6 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Savings Distribution
            </h3>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Credits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Debits</span>
            </div>
          </div>
        </div>

        <div className="relative h-64 mb-8">
          {savingsMetrics.monthlyData.map((data, i) => (
            <div 
              key={data.month} 
              className="absolute bottom-0 group"
              style={{ left: `${(i / 11) * 100}%`, width: '8%' }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                bg-gray-900 text-white text-xs rounded-lg py-2 px-3 z-10">
                <div className="font-medium mb-1">{data.month}</div>
                <div className="space-y-1">
                  <div className="flex justify-between gap-4">
                    <span>Credits:</span>
                    <span className="text-green-400">{formatUSD(data.credit)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Debits:</span>
                    <span className="text-red-400">{formatUSD(data.debit)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-gray-700 pt-1 mt-1">
                    <span>Net:</span>
                    <span className={data.net >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {formatUSD(data.net)}
                    </span>
                  </div>
                </div>
                <div className="text-gray-400 text-[10px] mt-1">
                  {data.count} transactions
                </div>
              </div>

              {/* Bar Chart */}
              <div className="flex flex-col items-center">
                <div className="relative w-full">
                  {/* Credits Bar */}
                  <div 
                    className="w-full bg-green-500 rounded-t transition-all duration-300"
                    style={{ height: `${(data.credit / maxAmount) * 180}px` }}
                  />
                  {/* Debits Bar */}
                  <div 
                    className="w-full bg-red-500 rounded-b transition-all duration-300 mt-px"
                    style={{ height: `${(data.debit / maxAmount) * 180}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-2 -rotate-45 origin-top-left">
                  {data.month}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Net Savings Line */}
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-indigo-500 rounded-full"
            style={{ 
              width: `${(savingsMetrics.totalSavings / (income || 1)) * 100}%`,
              minWidth: '2%'
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">Net Savings Rate</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {((savingsMetrics.totalSavings / (income || 1)) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

const SavingsCategoryBreakdown = ({ savings, type }: {
  savings: SavingData[];
  type: 'credit' | 'debit';
}) => {
  const categories = useMemo(() => {
    const categoryMap = savings
      .filter(s => s.type === type)
      .reduce((acc, curr) => {
        const categoryId = curr.categoryId || 'unallocated';
        if (!acc[categoryId]) {
          acc[categoryId] = { amount: 0, count: 0 };
        }
        acc[categoryId].amount += Math.abs(curr.amount);
        acc[categoryId].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

    const totalAmount = Object.values(categoryMap)
      .reduce((sum, { amount }) => sum + amount, 0);

    // Map unallocated savings to categories based on percentages
    if (categoryMap['unallocated']) {
      const unallocatedAmount = categoryMap['unallocated'].amount;
      const unallocatedCount = categoryMap['unallocated'].count;
      delete categoryMap['unallocated'];

      SAVINGS_CATEGORIES.forEach(category => {
        const allocatedAmount = (unallocatedAmount * category.percentage) / 100;
        if (!categoryMap[category.id]) {
          categoryMap[category.id] = { amount: 0, count: 0 };
        }
        categoryMap[category.id].amount += allocatedAmount;
        // Distribute count proportionally
        categoryMap[category.id].count += Math.round((unallocatedCount * category.percentage) / 100);
      });
    }

    return SAVINGS_CATEGORIES.map(category => ({
      id: category.id,
      label: category.label,
      amount: categoryMap[category.id]?.amount || 0,
      count: categoryMap[category.id]?.count || 0,
      percentage: ((categoryMap[category.id]?.amount || 0) / totalAmount) * 100,
      color: category.color
    })).sort((a, b) => b.amount - a.amount);
  }, [savings, type]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <ChartPieIcon className="w-6 h-6 text-indigo-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {type === 'credit' ? 'Savings' : 'Withdrawals'} by Category
        </h3>
      </div>

      <div className="space-y-4">
        {categories.map(category => (
          <div key={category.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category.label}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  ({category.count} transactions)
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatUSD(category.amount)}
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{ 
                  width: `${category.percentage}%`,
                  backgroundColor: category.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FloatingActionButton = ({ onAddTransaction, onAddSaving }: {
  onAddTransaction: () => void;
  onAddSaving: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed lg:bottom-8 lg:right-20 md:bottom-2 md:right-6 bottom-4 right-4 
        flex flex-col items-end space-y-4 z-50">
        {/* FAB Menu Items */}
        <div className={`flex flex-col items-end space-y-3 transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        >
          {/* Transaction Button */}
          <button
            onClick={() => {
              setIsOpen(false);
              onAddTransaction();
            }}
            className="group flex items-center gap-2 pl-4 pr-3 py-2 
              bg-gradient-to-r from-indigo-500 to-indigo-600 
              text-white rounded-full shadow-lg hover:shadow-indigo-500/25 
              hover:translate-x-0 translate-x-12 transition-all duration-300
              md:translate-x-12 sm:translate-x-16 xs:translate-x-8
              md:hover:translate-x-0 sm:hover:translate-x-0"
          >
            <span className="text-xs sm:text-sm md:text-sm font-medium whitespace-nowrap
              max-w-0 sm:max-w-none overflow-hidden transition-all duration-300">
              {t('dashboard.add_transaction')}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full 
              bg-indigo-500 flex items-center justify-center 
              shadow-inner group-hover:scale-110 transition-transform">
              <BanknotesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
          </button>

          {/* Saving Button */}
          <button
            onClick={() => {
              setIsOpen(false);
              onAddSaving();
            }}
            className="group flex items-center gap-2 pl-4 pr-3 py-2 
              bg-gradient-to-r from-emerald-500 to-emerald-600 
              text-white rounded-full shadow-lg hover:shadow-emerald-500/25 
              hover:translate-x-0 translate-x-12 transition-all duration-300
              md:translate-x-12 sm:translate-x-16 xs:translate-x-8
              md:hover:translate-x-0 sm:hover:translate-x-0"
          >
            <span className="text-xs sm:text-sm md:text-sm font-medium whitespace-nowrap
              max-w-0 sm:max-w-none overflow-hidden transition-all duration-300">
              {t('dashboard.add_saving')}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full 
              bg-emerald-500 flex items-center justify-center 
              shadow-inner group-hover:scale-110 transition-transform">
              <CurrencyDollarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
          </button>
        </div>
        
        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative rounded-full shadow-lg 
            transition-all duration-300 ease-in-out transform
            w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
            ${isOpen 
              ? 'bg-gray-700 hover:bg-gray-600 rotate-45 scale-110' 
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-110'
            }`}
        >
          {/* Background Glow Effect */}
          <div className={`absolute inset-0 rounded-full transition-opacity duration-300
            bg-gradient-to-r from-indigo-500 to-purple-600 blur-lg -z-10 opacity-50
            group-hover:opacity-75 hidden sm:block`} 
          />

          {/* Icon Container */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isOpen ? (
              <XMarkIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white 
                transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <PlusIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white 
                transition-transform duration-300 group-hover:scale-110" />
            )}
          </div>
        </button>
      </div>
    </>
  );
};

export const AnalyticsScreen = () => {
  const { transactions, isLoading: transactionsLoading, error } = useTransactions();
  const { state: savingState, loadSavings } = useSaving();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showSavingForm, setShowSavingForm] = useState(false);

  const filteredData = useMemo(() => {
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31);

    const yearTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= yearStart && date <= yearEnd;
    });

    const yearSavings = savingState.savings.filter(s => {
      const date = new Date(s.date);
      return date >= yearStart && date <= yearEnd;
    });

    return {
      transactions: yearTransactions,
      savings: yearSavings
    };
  }, [transactions, savingState.savings, selectedYear]);

  const yearIncome = filteredData.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = () => {
    setShowTransactionModal(true);
  };

  const handleAddSaving = () => {
    setShowSavingForm(true);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 font-medium mb-2">{error.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!transactions || transactionsLoading || savingState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <LoadingSpinner size="large" className="text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <AnalyticsHeader
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        <CardGroup 
          title="Overview" 
          icon={ChartBarIcon}
          defaultExpanded={true}
          accentColor="from-blue-500 to-blue-600"
        >
          <YearSummary
            transactions={filteredData.transactions}
            savings={filteredData.savings}
          />
        </CardGroup>

        <CardGroup 
          title="Monthly Analysis" 
          icon={ChartPieIcon}
          defaultExpanded={true}
          accentColor="from-purple-500 to-purple-600"
        >
          <MonthlyTrends
            transactions={filteredData.transactions}
            savings={filteredData.savings}
          />
        </CardGroup>

        <CardGroup 
          title="Savings Analysis" 
          icon={WalletIcon}
          defaultExpanded={true}
          accentColor="from-green-500 to-green-600"
        >
          <SavingsAnalysis
            savings={filteredData.savings}
            income={yearIncome}
          />
        </CardGroup>

        <CardGroup 
          title="Transaction Categories" 
          icon={BanknotesIcon}
          defaultExpanded={true}
          accentColor="from-indigo-500 to-indigo-600"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown
              transactions={filteredData.transactions}
              type="expense"
            />
            <CategoryBreakdown
              transactions={filteredData.transactions}
              type="income"
            />
          </div>
        </CardGroup>

        <CardGroup 
          title="Savings Categories" 
          icon={ArrowTrendingUpIcon}
          defaultExpanded={true}
          accentColor="from-amber-500 to-amber-600"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SavingsCategoryBreakdown
              savings={filteredData.savings}
              type="credit"
            />
            <SavingsCategoryBreakdown
              savings={filteredData.savings}
              type="debit"
            />
          </div>
        </CardGroup>

        {/* Floating Action Button */}
        <FloatingActionButton
          onAddTransaction={handleAddTransaction}
          onAddSaving={handleAddSaving}
        />

        {/* Transaction Modal */}
        {showTransactionModal && (
          <TransactionModal
            onClose={() => setShowTransactionModal(false)}
          />
        )}

        {/* Saving Form */}
        {showSavingForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <SavingForm
                onSubmit={async () => {
                  await loadSavings();
                  setShowSavingForm(false);
                }}
                onCancel={() => setShowSavingForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
