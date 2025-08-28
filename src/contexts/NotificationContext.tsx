import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTaskContext } from './TaskContext';
import { invitationService, Invitation } from '../services/invitationService';
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
  const { user } = useAuth();
  const { switchActiveOwner } = useTransactions();

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
    error
    , pendingInvites,
    refreshInvites: async () => {
      if (!user?.email) return;
      try {
        const invites = await invitationService.getPendingInvitationsForEmail(user.email);
        setPendingInvites(invites);
      } catch (e) {
        console.error('Failed to load invites', e);
      }
    },
    acceptInvite: async (inviteId: string) => {
      try {
        await invitationService.acceptInvitation(inviteId);
        // refresh list and notifications
        if (user && user.email) {
          const invites = await invitationService.getPendingInvitationsForEmail(user.email);
          setPendingInvites(invites);
        }
        // load the accepted invitation to find ownerId and switch active owner
        if (user && user.email) {
          const accepted = await invitationService.getPendingInvitationsForEmail(user.email);
          const justAccepted = accepted.find(inv => inv.id === inviteId) || null;
        if (justAccepted && justAccepted.ownerId) {
          try {
            await switchActiveOwner(justAccepted.ownerId);
          } catch (e) {
            console.error('Failed to switch to accepted owner', e);
          }
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
        if (user?.email) {
          const invites = await invitationService.getPendingInvitationsForEmail(user.email);
          setPendingInvites(invites);
        }
      } catch (e) {
        console.error('Failed to reject invite', e);
        throw e;
      }
    }
  };

  useEffect(() => {
    calculateGroups();
  }, [calculateGroups]);

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
