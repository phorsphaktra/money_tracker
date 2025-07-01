import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatUSD } from '../../utils/currencyUtils';
import { Saving } from '../../contexts/SavingContext';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface SavingsTypeMetricsCardProps {
  savings: Saving[];
}

interface TypeMetrics {
  total: number;
  count: number;
  average: number;
  largest: number;
  smallest: number;
  categories: {
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
}

export const SavingsTypeMetricsCard: React.FC<SavingsTypeMetricsCardProps> = ({ savings }) => {
  const { t } = useTranslation();

  const metrics = React.useMemo(() => {
    const creditMetrics: TypeMetrics = {
      total: 0,
      count: 0,
      average: 0,
      largest: 0,
      smallest: Infinity,
      categories: []
    };

    const debitMetrics: TypeMetrics = {
      total: 0,
      count: 0,
      average: 0,
      largest: 0,
      smallest: Infinity,
      categories: []
    };

    const categoryMap: Record<string, { credit: number; debit: number }> = {};

    // Process transactions
    savings.forEach(saving => {
      const categoryId = saving.categoryId || 'uncategorized';
      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = { credit: 0, debit: 0 };
      }

      if (saving.type === 'credit') {
        creditMetrics.total += saving.amount;
        creditMetrics.count += 1;
        creditMetrics.largest = Math.max(creditMetrics.largest, saving.amount);
        creditMetrics.smallest = Math.min(creditMetrics.smallest, saving.amount);
        categoryMap[categoryId].credit += saving.amount;
      } else {
        debitMetrics.total += saving.amount;
        debitMetrics.count += 1;
        debitMetrics.largest = Math.max(debitMetrics.largest, saving.amount);
        debitMetrics.smallest = Math.min(debitMetrics.smallest, saving.amount);
        categoryMap[categoryId].debit += saving.amount;
      }
    });

    // Calculate averages
    creditMetrics.average = creditMetrics.count > 0 ? creditMetrics.total / creditMetrics.count : 0;
    debitMetrics.average = debitMetrics.count > 0 ? debitMetrics.total / debitMetrics.count : 0;

    // Process categories
    Object.entries(categoryMap).forEach(([category, amounts]) => {
      if (amounts.credit > 0) {
        creditMetrics.categories.push({
          category,
          amount: amounts.credit,
          count: savings.filter(s => s.type === 'credit' && (s.categoryId || 'uncategorized') === category).length,
          percentage: (amounts.credit / creditMetrics.total) * 100
        });
      }
      if (amounts.debit > 0) {
        debitMetrics.categories.push({
          category,
          amount: amounts.debit,
          count: savings.filter(s => s.type === 'debit' && (s.categoryId || 'uncategorized') === category).length,
          percentage: (amounts.debit / debitMetrics.total) * 100
        });
      }
    });

    // Sort categories by amount
    creditMetrics.categories.sort((a, b) => b.amount - a.amount);
    debitMetrics.categories.sort((a, b) => b.amount - a.amount);

    return { credit: creditMetrics, debit: debitMetrics };
  }, [savings]);

  const renderMetricsCard = (type: 'credit' | 'debit', data: TypeMetrics) => {
    const isCredit = type === 'credit';
    const colorClass = isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const bgColorClass = isCredit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30';
    const Icon = isCredit ? ArrowUpIcon : ArrowDownIcon;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-full ${bgColorClass}`}>
                <Icon className={`h-5 w-5 ${colorClass}`}/>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isCredit ? t('savings.credit') : t('savings.debit')}
              </h3>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${colorClass}`}>
                {formatUSD(data.total)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {data.count} {t('savings.transactions')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('savings.average')}</p>
              <p className={`text-lg font-semibold ${colorClass}`}>
                {formatUSD(data.average)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('savings.largest')}</p>
              <p className={`text-lg font-semibold ${colorClass}`}>
                {formatUSD(data.largest)}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('savings.category_breakdown')}
            </h4>
            <div className="space-y-2">
              {data.categories.map(category => (
                <div key={category.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {category.category === 'uncategorized' ? t('savings.uncategorized') : category.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={colorClass}>{formatUSD(category.amount)}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ({category.count})
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isCredit ? 'bg-green-600 dark:bg-green-400' : 'bg-red-600 dark:bg-red-400'}`}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderMetricsCard('credit', metrics.credit)}
      {renderMetricsCard('debit', metrics.debit)}
    </div>
  );
}; 