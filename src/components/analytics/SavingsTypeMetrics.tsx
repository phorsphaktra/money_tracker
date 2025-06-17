import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatUSD } from '../../utils/currencyUtils';
import { Saving } from '../../contexts/SavingContext';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface SavingsTypeMetricsProps {
  savings: Saving[];
}

interface CategoryMetrics {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export const SavingsTypeMetrics: React.FC<SavingsTypeMetricsProps> = ({ savings }) => {
  const { t } = useTranslation();

  const { creditMetrics, debitMetrics } = React.useMemo(() => {
    const creditMap: Record<string, CategoryMetrics> = {};
    const debitMap: Record<string, CategoryMetrics> = {};
    let totalCredits = 0;
    let totalDebits = 0;

    // Calculate totals and process each saving
    savings.forEach(saving => {
      const map = saving.type === 'credit' ? creditMap : debitMap;
      const total = saving.type === 'credit' ? totalCredits : totalDebits;

      if (!map[saving.category]) {
        map[saving.category] = {
          category: saving.category,
          amount: 0,
          count: 0,
          percentage: 0
        };
      }

      map[saving.category].amount += saving.amount;
      map[saving.category].count += 1;

      if (saving.type === 'credit') {
        totalCredits += saving.amount;
      } else {
        totalDebits += saving.amount;
      }
    });

    // Calculate percentages and convert to arrays
    const processMetrics = (map: Record<string, CategoryMetrics>, total: number) =>
      Object.values(map)
        .map(metrics => ({
          ...metrics,
          percentage: (metrics.amount / total) * 100
        }))
        .sort((a, b) => b.amount - a.amount);

    return {
      creditMetrics: processMetrics(creditMap, totalCredits),
      debitMetrics: processMetrics(debitMap, totalDebits)
    };
  }, [savings]);

  const renderMetricsCard = (
    metrics: CategoryMetrics[],
    type: 'credit' | 'debit',
    totalAmount: number
  ) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {type === 'credit' ? (
            <ArrowUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <ArrowDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t(`savings.${type}s`)}
          </h3>
        </div>
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {formatUSD(totalAmount)}
        </span>
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.category} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {metric.category}
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatUSD(metric.amount)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({metric.count})
                </span>
              </div>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  type === 'credit'
                    ? 'bg-green-600 dark:bg-green-400'
                    : 'bg-red-600 dark:bg-red-400'
                }`}
                style={{ width: `${metric.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                {metric.percentage.toFixed(1)}%
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {metric.count} {t('savings.transactions')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const totalCredits = creditMetrics.reduce((sum, m) => sum + m.amount, 0);
  const totalDebits = debitMetrics.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {renderMetricsCard(creditMetrics, 'credit', totalCredits)}
      {renderMetricsCard(debitMetrics, 'debit', totalDebits)}
    </div>
  );
}; 