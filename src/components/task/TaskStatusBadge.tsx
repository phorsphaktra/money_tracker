import React from 'react';

interface TaskStatusBadgeProps {
  status: string;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
  const getStatusStyle = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400';
      case 'blocked':
        return 'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-500/10 text-gray-800 dark:text-gray-400';
    }
  };

  const formatStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusStyle()}`}>
      {formatStatus(status)}
    </span>
  );
};
