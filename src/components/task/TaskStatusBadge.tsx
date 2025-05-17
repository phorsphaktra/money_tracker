import React from 'react';

interface TaskStatusBadgeProps {
  status: string;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return {
          style: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/20 dark:to-emerald-500/20 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-500/30',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'in_progress':
        return {
          style: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-500/30',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )
        };
      case 'blocked':
        return {
          style: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-500/20 dark:to-rose-500/20 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-500/30',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      default:
        return {
          style: 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-500/20 dark:to-slate-500/20 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-500/30',
          icon: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const formatStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const { style, icon } = getStatusConfig();

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full 
        shadow-sm transition-all duration-200 hover:shadow-md ${style}`}
      role="status"
    >
      {icon}
      {formatStatus(status)}
    </span>
  );
};
