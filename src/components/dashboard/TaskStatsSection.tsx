import { FC } from 'react';
import { CardStats } from './CardStats';

interface TaskStatsSectionProps {
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    completionRate: number;
  };
  isLoading: boolean;
  formatNumber: (num: number, language: string) => string;
  language: string;
  t: (key: string) => string;
}

export const TaskStatsSection: FC<TaskStatsSectionProps> = ({
  stats,
  isLoading,
  formatNumber,
  language,
  t,
}) => (
  <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
      {t("dashboard.task_overview")}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <CardStats
        title={t("dashboard.total_tasks")}
        value={stats.total.toString()}
        trend={`${formatNumber(stats.completionRate, language)}%`}
        isPositive={true}
        isLoading={isLoading}
        icon="wallet"
      />
      <CardStats
        title={t("dashboard.completed_tasks")}
        value={stats.completed.toString()}
        trend=""
        isPositive={true}
        isLoading={isLoading}
        icon="income"
      />
      <CardStats
        title={t("dashboard.in_progress_tasks")}
        value={stats.inProgress.toString()}
        trend=""
        isPositive={true}
        isLoading={isLoading}
        icon="income"
      />
      <CardStats
        title={t("dashboard.blocked_tasks")}
        value={stats.blocked.toString()}
        trend=""
        isPositive={false}
        isLoading={isLoading}
        icon="wallet"
      />
    </div>
  </div>
);
