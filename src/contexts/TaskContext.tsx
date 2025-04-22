import React, { createContext, useContext, useState, useEffect } from 'react';
import * as taskService from '../services/taskService';
import { Task } from '../types/task'
import { useAuth } from './AuthContext';

interface TaskContextType {
  tasks: Task[];
  groupedTasks: { [date: string]: Task[] };
  loading: boolean;
  error: string | null;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (taskId: string, completed: boolean) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  getTasksByDate: (date: string) => Promise<Task[]>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groupedTasks, setGroupedTasks] = useState<{ [date: string]: Task[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const [tasksResponse, groupedResponse] = await Promise.all([
        taskService.getTasks(user.uid),
        taskService.getGroupedTasks(user.uid)
      ]);

      if (!tasksResponse.success) {
        throw new Error(tasksResponse.error);
      }

      if (!groupedResponse.success) {
        throw new Error(groupedResponse.error);
      }

      setTasks(tasksResponse.data || []);
      setGroupedTasks(groupedResponse.data || {});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const response = await taskService.createTask(user.uid, task);
      if (!response.success) {
        throw new Error(response.error);
      }
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, completed: boolean) => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const response = await taskService.updateTask(user.uid, taskId, { completed });
      if (!response.success) {
        throw new Error(response.error);
      }
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const response = await taskService.deleteTask(user.uid, taskId);
      if (!response.success) {
        throw new Error(response.error);
      }
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const getTasksByDate = async (date: string): Promise<Task[]> => {
    if (!user?.uid) return [];

    try {
      const response = await taskService.getTasksByDate(user.uid, date);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks by date');
      return [];
    }
  };

  useEffect(() => {
    if (user?.uid) {
      refreshTasks();
    } else {
      setTasks([]);
      setGroupedTasks({});
    }
  }, [user?.uid]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        groupedTasks,
        loading,
        error,
        addTask,
        updateTask,
        deleteTask,
        refreshTasks,
        getTasksByDate,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
