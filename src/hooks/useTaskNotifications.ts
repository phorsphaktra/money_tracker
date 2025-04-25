import { useNotifications } from '../contexts/NotificationContext';

export const useTaskNotifications = () => {
  try {
    return useNotifications();
  } catch (error) {
    console.error('NotificationProvider not found:', error);
    return {
      notificationCounts: { overdue: 0, dueToday: 0, upcoming: 0 },
      taskGroups: { overdueTasks: [], dueTodayTasks: [], upcomingTasks: [] },
      totalNotifications: 0,
      refreshNotifications: () => {},
      isLoading: false,
      error: 'NotificationProvider not found'
    };
  }
};
