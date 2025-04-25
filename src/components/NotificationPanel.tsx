import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Task } from '../types/task';
import { ArrowPathIcon, ExclamationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { NotificationItem } from './task/NotificationItem';

interface NotificationPanelProps {
  onClose: () => void;
  onRefresh?: () => void;
}

export const NotificationPanel = ({ onClose, onRefresh }: NotificationPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { 
    notificationCounts, 
    totalNotifications,
    taskGroups: { overdueTasks, dueTodayTasks, upcomingTasks },
    isLoading,
    error: contextError,
    refreshNotifications
  } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      onRefresh?.();
      refreshNotifications();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  function handleTaskClick(_task: Task): void {
    throw new Error('Function not implemented.');
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/5 dark:bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div 
        ref={panelRef}
        className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl 
          shadow-lg border border-slate-200/50 dark:border-slate-700/50 
          overflow-hidden z-50"
      >
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
            {totalNotifications > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-indigo-500 text-white rounded-full">
                {totalNotifications}
              </span>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-700 
              dark:text-slate-400 dark:hover:text-slate-200
              hover:bg-slate-100 dark:hover:bg-slate-700/50
              transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {contextError ? (
            <div className="p-4 text-sm text-red-500 dark:text-red-400 text-center">
              {contextError}
            </div>
          ) : totalNotifications === 0 ? (
            <div className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">
              No notifications
            </div>
          ) : (
            <>
              {notificationCounts.overdue > 0 && (
                <NotificationSection
                  title="OVERDUE"
                  icon={<ExclamationCircleIcon className="w-4 h-4 text-red-500" />}
                  bgClass="bg-red-50 dark:bg-red-500/10"
                  textClass="text-red-600 dark:text-red-400"
                  tasks={overdueTasks}
                  type="overdue"
                  onTaskClick={handleTaskClick}
                />
              )}

              {notificationCounts.dueToday > 0 && (
                <NotificationSection
                  title="DUE TODAY"
                  icon={<ClockIcon className="w-4 h-4 text-amber-500" />}
                  bgClass="bg-amber-50 dark:bg-amber-500/10"
                  textClass="text-amber-600 dark:text-amber-400"
                  tasks={dueTodayTasks}
                  type="today"
                  onTaskClick={handleTaskClick}
                />
              )}

              {notificationCounts.upcoming > 0 && (
                <NotificationSection
                  title="UPCOMING"
                  icon={<ClockIcon className="w-4 h-4 text-blue-500" />}
                  bgClass="bg-blue-50 dark:bg-blue-500/10"
                  textClass="text-blue-600 dark:text-blue-400"
                  tasks={upcomingTasks}
                  type="upcoming"
                  onTaskClick={handleTaskClick}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

interface NotificationSectionProps {
  title: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  tasks: Task[];
  type: 'overdue' | 'today' | 'upcoming';
  onTaskClick: (task: Task) => void;
}

const NotificationSection = ({
  title,
  icon,
  bgClass,
  textClass,
  tasks,
  type,
  onTaskClick
}: NotificationSectionProps) => (
  <div className="border-b border-slate-200/50 dark:border-slate-700/50">
    <div className={`px-4 py-2 ${bgClass} flex items-center gap-2`}>
      {icon}
      <span className={`text-xs font-medium ${textClass}`}>{title}</span>
    </div>
    <div>
      {tasks.map(task => (
        <NotificationItem
          key={task.id}
          task={task}
          type={type}
          onClick={onTaskClick}
        />
      ))}
    </div>
  </div>
);
