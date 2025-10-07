import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTaskContext } from './TaskContext';
import { invitationService, Invitation } from '../services/invitationService';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionContext';
import { isToday, isPast, addDays } from 'date-fns';
import { Task } from '../types/task';

interface NotificationContextType {
  notificationCounts: {
    overdue: number;
    dueToday: number;
    upcoming: number;
  };
  taskGroups: {
    overdueTasks: Task[];
    dueTodayTasks: Task[];
    upcomingTasks: Task[];
  };
  totalNotifications: number;
  refreshNotifications: () => void;
  isLoading: boolean;
  error: string | null;
  // Invitations
  pendingInvites: Invitation[];
  refreshInvites: () => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<void>;
  rejectInvite: (inviteId: string) => Promise<void>;
  // Push notifications
  isPushNotificationSupported: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  // Uninvite functionality
  uninviteMember: (inviteeEmail: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { tasks } = useTaskContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskGroups, setTaskGroups] = useState<NotificationContextType['taskGroups']>({
    overdueTasks: [],
    dueTodayTasks: [],
    upcomingTasks: []
  });
  const [notificationCounts, setNotificationCounts] = useState<NotificationContextType['notificationCounts']>({
    overdue: 0,
    dueToday: 0,
    upcoming: 0
  });
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [isPushNotificationSupported, setIsPushNotificationSupported] = useState(false);
  const { user } = useAuth();
  const { switchActiveOwner } = useTransactions();
  // lazy-load saving context to avoid circular imports in some setups
  const { switchActiveOwner: switchSavingOwner } = (function() {
    try {
      return require('./SavingContext').useSaving();
    } catch (e) {
      return { switchActiveOwner: async (_: string) => {} } as any;
    }
  })();

  const calculateGroups = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
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
        return dueDate > today && dueDate <= addDays(today, 1);
      });

      setTaskGroups({ overdueTasks, dueTodayTasks, upcomingTasks });
      setNotificationCounts({
        overdue: overdueTasks.length,
        dueToday: dueTodayTasks.length,
        upcoming: upcomingTasks.length
      });
    } catch (err) {
      setError('Failed to process notifications');
      console.error('Notification error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tasks]);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!user?.uid) return false;
    
    try {
      const token = await notificationService.requestPermission();
      if (token) {
        await notificationService.saveTokenToUser(user.uid, token);
        setIsPushNotificationSupported(true);
        return true;
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
    return false;
  }, [user?.uid]);

  const uninviteMember = useCallback(async (inviteeEmail: string) => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    try {
      await invitationService.uninviteMember(user.uid, inviteeEmail);
      // Refresh invites after uninviting
      await refreshInvites();
    } catch (error) {
      console.error('Failed to uninvite member:', error);
      throw error;
    }
  }, [user?.uid]);

  const refreshInvites = useCallback(async () => {
    if (!user?.email) return;
    try {
      const invites = await invitationService.getPendingInvitationsForEmail(user.email);
      setPendingInvites(invites);
    } catch (e) {
      console.error('Failed to load invites', e);
    }
  }, [user?.email]);

  const value: NotificationContextType = {
    notificationCounts,
    taskGroups: {
      overdueTasks: taskGroups.overdueTasks,
      dueTodayTasks: taskGroups.dueTodayTasks,
      upcomingTasks: taskGroups.upcomingTasks
    },
    totalNotifications: notificationCounts.overdue + notificationCounts.dueToday + notificationCounts.upcoming,
    refreshNotifications: calculateGroups,
    isLoading,
    error,
    pendingInvites,
    refreshInvites,
    acceptInvite: async (inviteId: string) => {
      try {
        const acceptedInvitation = await invitationService.acceptInvitation(inviteId);
        // refresh list and notifications
        await refreshInvites();
        // Use returned ownerId to switch active owner immediately
        if (acceptedInvitation && acceptedInvitation.ownerId) {
          try {
            await switchActiveOwner(acceptedInvitation.ownerId);
          } catch (e) {
            console.error('Failed to switch to accepted owner (transactions)', e);
          }
          try {
            await switchSavingOwner(acceptedInvitation.ownerId);
          } catch (e) {
            console.error('Failed to switch to accepted owner (savings)', e);
          }
        }
      } catch (e) {
        console.error('Failed to accept invite', e);
        throw e;
      }
    },
    rejectInvite: async (inviteId: string) => {
      try {
        await invitationService.rejectInvitation(inviteId);
        await refreshInvites();
      } catch (e) {
        console.error('Failed to reject invite', e);
        throw e;
      }
    },
    isPushNotificationSupported,
    requestNotificationPermission,
    uninviteMember
  };

  useEffect(() => {
    calculateGroups();
  }, [calculateGroups]);

  useEffect(() => {
    // Check if push notifications are supported
    setIsPushNotificationSupported(
      'Notification' in window && 
      'serviceWorker' in navigator && 
      'PushManager' in window
    );
  }, []);

  useEffect(() => {
    // load invites on auth change
    (async () => {
      if (user?.email) {
        try {
          const invites = await invitationService.getPendingInvitationsForEmail(user.email);
          setPendingInvites(invites);
        } catch (e) {
          console.error('Failed to load invites', e);
        }
      } else {
        setPendingInvites([]);
      }
    })();
  }, [user?.email]);

  useEffect(() => {
    // Set up foreground message listener
    const unsubscribe = notificationService.onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload);
      
      // Handle different notification types
      if (payload.data?.type === 'invitation') {
        // Refresh invites when new invitation is received
        refreshInvites();
      }
      
      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'Money Tracker', {
          body: payload.notification?.body || 'You have a new notification',
          icon: '/icon-192.png',
          tag: payload.data?.type || 'default'
        });
      }
    });

    return unsubscribe;
  }, [refreshInvites]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
