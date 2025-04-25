import React from 'react';

interface TaskStatusBadgeProps {
  status: string;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusStyle()}`}>
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
