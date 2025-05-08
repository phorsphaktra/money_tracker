import { FC } from "react";
import {
  FinancialMetrics,
  MonthlyStats,
  CategorySpending,
  HealthMetrics,
} from "../../types/financial";
import {
  calculateDetailedHealth,
  calculateMonthlyAverageAmount,
  formatMonthlyAverage,
} from "../../utils/financialCalculations";

interface FinancialSummaryProps {
  enhancedStats: FinancialMetrics;
  monthlyStats: MonthlyStats;
  language: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  formatNumber: (num: number, language: string) => string;
  t: (key: string) => string;
  topCategories: CategorySpending[];
}

const MetricCard: FC<{
  title: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  className?: string;
}> = ({ title, value, trend, subtitle, className }) => (
  <div
    className={`bg-white dark:bg-gray-800/40 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700/50 ${className}`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {title}
      </div>
      {trend && (
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            trend.isPositive
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {trend.value > 0 ? "+" : ""}
          {trend.value.toFixed(1)}%
        </span>
      )}
    </div>
    <div className="text-3xl font-bold text-gray-900 dark:text-white">
      {value}
    </div>
    {subtitle && (
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        {subtitle}
      </div>
    )}
  </div>
);

const HealthIndicator: FC<{
  status: string;
  message: string;
  details?: HealthMetrics["details"];
  t: (key: string) => string;
}> = ({ status, message, details, t }) => (
  <div className="bg-white dark:bg-gray-800/40 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {t("dashboard.financial_health")}
      </span>
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
          status === "excellent"
            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : status === "good"
            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
            : status === "warning"
            ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            status === "excellent"
              ? "bg-green-500"
              : status === "good"
              ? "bg-blue-500"
              : status === "warning"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        ></span>
        {t(`dashboard.health.${status}`)}
      </span>
    </div>

    {details && (
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">Savings</div>
          <div className="text-lg font-semibold">
            {Math.round(details.savingsHealth)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Spending</div>
          <div className="text-lg font-semibold">
            {Math.round(details.spendingHealth)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Balance</div>
          <div className="text-lg font-semibold">
            {Math.round(details.balanceHealth)}%
          </div>
        </div>
      </div>
    )}

    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
      {message}
    </p>
  </div>
);

const SpendingCategories: FC<{
  categories: CategorySpending[];
  formatNumber: (num: number, language: string) => string;
  language: string;
  t: (key: string) => string;
  type: "income" | "expense";
}> = ({ categories, formatNumber, language, t, type }) => {
  // Only filter categories that match the specified type
  const filteredCategories = categories
    .filter((cat) => cat.type === type)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const totalAmount = filteredCategories.reduce(
    (sum, cat) => sum + cat.amount,
    0
  );

  return (
    <div className="bg-white dark:bg-gray-800/40 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">
        {t(
          type === "income" ? "dashboard.top_income" : "dashboard.top_expenses"
        )}
      </h3>
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            {t(`dashboard.no_${type}_data`)}
          </p>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category.category}
                </span>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-semibold ${
                      type === "income"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    ${formatNumber(category.amount, language)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({((category.amount / totalAmount) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    type === "income"
                      ? "bg-green-500 dark:bg-green-400"
                      : "bg-red-500 dark:bg-red-400"
                  }`}
                  style={{ width: `${(category.amount / totalAmount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const FinancialSummary: FC<FinancialSummaryProps> = ({
  enhancedStats,
  monthlyStats,
  language,
  isCollapsed,
  onToggleCollapse,
  formatNumber,
  t,
  topCategories,
}) => {
  const healthMetrics = calculateDetailedHealth(
    enhancedStats.savingsRate,
    monthlyStats.change,
    enhancedStats.monthlyAverage
  );

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("dashboard.financial_summary")}
            </h2>
            <div className="flex items-center gap-3">
              {/* <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Score: {healthMetrics.score}/100
                </span>
              </div>
              {enhancedStats.hasIncreasedSpending && (
                <span className="text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
                  <span className="text-lg">⚠️</span> {t("dashboard.increased_spending")}
                </span>
              )} */}
            </div>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100"
        }`}
      >
        <div className="p-6 space-y-6">
          {/* <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              title={t("dashboard.monthly_average")}
              value={formatMonthlyAverage(
                calculateMonthlyAverageAmount(monthlyStats),
                language,
                formatNumber
              )}
              trend={{
                value: monthlyStats.change,
                isPositive: monthlyStats.change < 0
              }}
              subtitle={`vs Last Month: $${formatNumber(Math.max(0, monthlyStats.lastMonth), language)}`}
            />
            <MetricCard
              title={t("dashboard.savings_rate")}
              value={`${formatNumber(enhancedStats.savingsRate, language)}%`}
              className={enhancedStats.savingsRate > 0 ? "text-green-600" : "text-red-600"}
            />
          </div> */}

          {/* <HealthIndicator
            status={healthMetrics.status}
            message={healthMetrics.message}
            details={healthMetrics.details}
            t={t}
          /> */}
          {/* 
          {topCategories.length > 0 && (
            <SpendingCategories
              categories={topCategories}
              formatNumber={formatNumber}
              language={language}
              t={t}
            />
          )} */}

          {topCategories.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <SpendingCategories
                categories={topCategories.filter(
                  (cat) => cat.type === "income"
                )}
                formatNumber={formatNumber}
                language={language}
                t={t}
                type="income"
              />
              <SpendingCategories
                categories={topCategories.filter(
                  (cat) => cat.type === "expense"
                )}
                formatNumber={formatNumber}
                language={language}
                t={t}
                type="expense"
              />
            </div>
          )}

          <div className="text-xs text-gray-400 mt-4">
            {t("dashboard.last_updated")}:{" "}
            {new Date(enhancedStats.lastUpdated).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
