import { FC } from 'react';

interface MonthlyMetricsCardProps {
  monthLabel: string;
  metrics: {
    income: number;
    spending: number;
    netBalance: number;
  };
  formatNumber: (num: number, language: string) => string;
  language: string;
  t: (key: string) => string;
}

export const MonthlyMetricsCard: FC<MonthlyMetricsCardProps> = ({
  monthLabel,
  metrics,
  formatNumber,
  language,
  t,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
        {t("dashboard.monthly_metrics")}
      </h3>
      <span className="text-xs sm:text-sm text-gray-500">{monthLabel}</span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {/* Income Section */}
      <MetricItem
        label={t("dashboard.monthly_income")}
        value={metrics.income}
        type="income"
        total={metrics.income + metrics.spending}
        formatNumber={formatNumber}
        language={language}
      />

      {/* Spending Section */}
      <MetricItem
        label={t("dashboard.monthly_spending")}
        value={metrics.spending}
        type="spending"
        total={metrics.income + metrics.spending}
        formatNumber={formatNumber}
        language={language}
      />

      {/* Net Balance Section */}
      <MetricItem
        label={t("dashboard.net_balance")}
        value={metrics.netBalance}
        type="balance"
        total={metrics.income + metrics.spending}
        formatNumber={formatNumber}
        language={language}
      />
    </div>
  </div>
);

interface MetricItemProps {
  label: string;
  value: number;
  type: 'income' | 'spending' | 'balance';
  total: number;
  formatNumber: (num: number, language: string) => string;
  language: string;
}

const MetricItem: FC<MetricItemProps> = ({
  label,
  value,
  type,
  total,
  formatNumber,
  language,
}) => {
  const getStyles = () => {
    switch (type) {
      case 'income':
        return {
          text: 'text-green-500',
          bg: 'bg-green-100',
          bar: 'bg-green-500',
          prefix: '+'
        };
      case 'spending':
        return {
          text: 'text-red-500',
          bg: 'bg-red-100',
          bar: 'bg-red-500',
          prefix: '-'
        };
      default:
        return {
          text: value >= 0 ? 'text-blue-500' : 'text-red-500',
          bg: 'bg-blue-100',
          bar: value >= 0 ? 'bg-blue-500' : 'bg-red-500',
          prefix: ''
        };
    }
  };

  const styles = getStyles();

  // Prevent division by zero for bar width
  const barWidth = total > 0 ? `${(Math.abs(value) / total) * 100}%` : '0%';

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`text-base sm:text-lg font-semibold ${styles.text}`}>
          {styles.prefix}${formatNumber(Math.abs(value), language)}
          {type === 'balance' && (
            <span className="text-xs ml-1">{value >= 0 ? '▲' : '▼'}</span>
          )}
        </span>
      </div>
      <div className={`h-1.5 ${styles.bg} rounded-full`}>
        <div 
          className={`h-1.5 ${styles.bar} rounded-full transition-all duration-300`} 
          style={{ width: barWidth }}
        />
      </div>
    </div>
  );
};
