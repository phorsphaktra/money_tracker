import React from 'react';

interface TaskStatCardProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

export const TaskStatCard = ({ label, value, color, icon }: TaskStatCardProps) => {
  return (
    <div className={`bg-white dark:bg-slate-800/50 shadow-sm
      rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50
      hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className={`mt-2 text-3xl font-bold text-${color}-600 dark:text-${color}-400`}>
            {value}
          </p>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-500/10 
          text-${color}-600 dark:text-${color}-400`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
