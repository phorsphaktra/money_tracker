import { Task } from '../types/task';
import { format, isToday, isPast, addDays } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { ArrowPathIcon, ExclamationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface NotificationPanelProps {
  tasks: Task[];
  onClose: () => void;
  onRefresh?: () => Promise<void>;
}

export const NotificationPanel = ({ tasks, onClose, onRefresh }: NotificationPanelProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState({
    overdue: 0,
    dueToday: 0,
    upcoming: 0
  });

  const getTaskGroups = useCallback(() => {
    const incompleteTasks = tasks.filter(task => task.status !== 'completed');
    
    const overdueTasks = incompleteTasks.filter(task => 
      isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
    );
    
    const dueTodayTasks = incompleteTasks.filter(task => 
      isToday(new Date(task.dueDate))
    );
    
    const upcomingTasks = incompleteTasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      return dueDate > today && dueDate <= addDays(today, 3);
    });

    return { overdueTasks, dueTodayTasks, upcomingTasks };
  }, [tasks]);

  useEffect(() => {
    const { overdueTasks, dueTodayTasks, upcomingTasks } = getTaskGroups();
    setNotificationCounts({
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      upcoming: upcomingTasks.length
    });
  }, [tasks, getTaskGroups]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  };

  const { overdueTasks, dueTodayTasks, upcomingTasks } = getTaskGroups();
  const totalNotifications = notificationCounts.overdue + notificationCounts.dueToday + notificationCounts.upcoming;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg 
      border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
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
        {totalNotifications === 0 ? (
          <div className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">
            No notifications
          </div>
        ) : (
          <>
            {notificationCounts.overdue > 0 && (
              <div className="border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="px-4 py-2 bg-red-50 dark:bg-red-500/10 flex items-center gap-2">
                  <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">OVERDUE</span>
                </div>
                {overdueTasks.map(task => (
                  <NotificationItem key={task.id} task={task} type="overdue" />
                ))}
              </div>
            )}

            {notificationCounts.dueToday > 0 && (
              <div className="border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">DUE TODAY</span>
                </div>
                {dueTodayTasks.map(task => (
                  <NotificationItem key={task.id} task={task} type="today" />
                ))}
              </div>
            )}

            {notificationCounts.upcoming > 0 && (
              <div>
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">UPCOMING</span>
                </div>
                {upcomingTasks.map(task => (
                  <NotificationItem key={task.id} task={task} type="upcoming" />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const NotificationItem = ({ task, type }: { task: Task; type: 'overdue' | 'today' | 'upcoming' }) => (
  <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
    <div className="flex gap-3 items-start">
      <div className={`w-2 h-2 mt-2 rounded-full ${
        type === 'overdue' ? 'bg-red-500' :
        type === 'today' ? 'bg-amber-500' :
        'bg-blue-500'
      }`} />
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {task.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Due {format(new Date(task.dueDate), 'PPp')}
        </p>
      </div>
    </div>
  </div>
);
