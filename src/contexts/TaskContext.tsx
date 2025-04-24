import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as taskService from '../services/taskService';
import { Task, TaskProject } from '../types/task';
import { useAuth } from './AuthContext';
import { createTask } from '../services/taskService';
import { auth } from '../config/firebase';

interface TaskContextType {
  tasks: Task[];
  projects: TaskProject[];
  loading: boolean;
  error: string | null;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addProject: (project: Omit<TaskProject, 'id'>) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<TaskProject>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getProjectTasks: (projectId: string) => Task[];
  refreshData: () => Promise<void>;
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
  const [projects, setProjects] = useState<TaskProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndTransformTask = useCallback((task: Partial<Task>): Task => {
    const now = new Date().toISOString();
    const errors: string[] = [];

    // Required field validation
    if (!task.title?.trim()) errors.push('Task title is required');
    if (!task.projectId) errors.push('Project ID is required');

    // Date validation
    const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
    if (isNaN(dueDate.getTime())) errors.push('Invalid due date');

    // Status validation
    const validStatuses = ['initial', 'in_progress', 'review', 'completed', 'blocked'];
    if (task.status && !validStatuses.includes(task.status)) {
      errors.push('Invalid status');
    }

    // Priority validation
    const validPriorities = ['Low', 'Medium', 'High'];
    if (task.priority && !validPriorities.includes(task.priority)) {
      errors.push('Invalid priority');
    }

    // if (errors.length > 0) {
    //   throw new Error(`Invalid task data: ${errors.join(', ')}`);
    // }

    // Transform and sanitize data
    return {
      id: task.id || '',
      projectId: task.projectId || '',
      title: task.title?.trim() || '',
      description: task.description?.trim() || '',
      status: task.status || 'initial',
      priority: task.priority || 'Medium',
      assignedTo: task.assignedTo || '',
      dueDate: dueDate.toISOString(),
      createdAt: task.createdAt || now,
      updatedAt: now,
      date: task.date || now,
      comments: Array.isArray(task.comments) 
        ? task.comments.map(comment => ({
            ...comment,
            message: comment.message?.trim() || '',
            createdAt: comment.createdAt || now
          }))
        : []
    };
  }, []);

  const updateTasksOptimistically = useCallback((updatedTask: Task) => {
    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(t => t.id === updatedTask.id);
      if (taskIndex === -1) return [...prevTasks, updatedTask];
      const newTasks = [...prevTasks];
      newTasks[taskIndex] = updatedTask;
      return newTasks;
    });
  }, []);

  const refreshData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const [tasksResponse, projectsResponse] = await Promise.all([
        taskService.getTasks(user.uid),
        taskService.getProjects(user.uid)
      ]);

      if (!tasksResponse.success || !projectsResponse.success) {
        throw new Error(tasksResponse.error || projectsResponse.error);
      }

      const validatedTasks = (tasksResponse.data || [])
        .map(validateAndTransformTask)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setTasks(prevTasks => {
        const taskMap = new Map([...prevTasks, ...validatedTasks].map(task => [task.id, task]));
        return Array.from(taskMap.values());
      });

      setProjects(projectsResponse.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData: Partial<Task>) => {
    setLoading(true);
    try {
      if (!auth.currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const result = await createTask(auth.currentUser.uid, taskData as Omit<Task, 'id'>);
      if (!result.success) {
        throw new Error(result.error);
      }

      // Refresh tasks after creation
      setTasks([]);
      // Task added successfully, no need to return data
    } catch (error) {
      console.error('Error in addTask:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user?.uid) return;

    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    const updatedTask = { ...originalTask, ...updates, updatedAt: new Date().toISOString() };

    try {
      updateTasksOptimistically(updatedTask);
      const response = await taskService.updateTask(user.uid, taskId, originalTask.projectId,updates, );
      
      if (!response.success) {
        throw new Error(response.error);
      }
    } catch (err) {
      // Rollback to original state
      updateTasksOptimistically(originalTask);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const projectId = tasks.find(task => task.id === taskId)?.projectId || '';
      const response = await taskService.deleteTask(user.uid, taskId, projectId);
      if (!response.success) {
        throw new Error(response.error);
      }
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (project: Omit<TaskProject, 'id'>) => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const response = await taskService.createProject(user.uid, project);
      if (!response.success) {
        throw new Error(response.error);
      }
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add project');
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId: string, updates: Partial<TaskProject>) => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const response = await taskService.updateProject(user.uid, projectId, updates);
      if (!response.success) {
        throw new Error(response.error);
      }
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const response = await taskService.deleteProject(user.uid, projectId);
      if (!response.success) {
        throw new Error(response.error);
      }
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  useEffect(() => {
    if (user?.uid) {
      refreshData();
    } else {
      setTasks([]);
      setProjects([]);
    }
  }, [user?.uid]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        projects,
        loading,
        error,
        addTask,
        updateTask,
        deleteTask,
        addProject,
        updateProject,
        deleteProject,
        getProjectTasks,
        refreshData,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
