import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface GroupedTasks {
  [date: string]: Task[];
}

const COLLECTION_NAME = 'tasks';

export const getTasks = async (userId: string): Promise<ApiResponse<Task[]>> => {
  try {
    if (!userId) throw new Error('User ID is required');
    
    const tasksCollection = collection(db, 'tasks', userId, 'user_tasks');
    const q = query(tasksCollection, orderBy('date', 'desc'));
    const taskSnapshot = await getDocs(q);
    
    const tasks = taskSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));

    return { success: true, data: tasks };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tasks'
    };
  }
};

export const createTask = async (userId: string, task: Omit<Task, 'id'>): Promise<ApiResponse<string>> => {
  try {
    if (!userId) throw new Error('User ID is required');
    
    const tasksCollection = collection(db, 'tasks', userId, 'user_tasks');
    const docRef = await addDoc(tasksCollection, {
      ...task,
      date: new Date().toISOString(),
      completed: false
    });

    return { success: true, data: docRef.id };
  } catch (error) {
    console.error('Error creating task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task'
    };
  }
};

export const updateTask = async (
  userId: string, 
  taskId: string, 
  updates: Partial<Task>
): Promise<ApiResponse<void>> => {
  try {
    if (!userId) throw new Error('User ID is required');
    
    const taskRef = doc(db, 'tasks', userId, 'user_tasks', taskId);
    await updateDoc(taskRef, updates);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task'
    };
  }
};

export const deleteTask = async (userId: string, taskId: string): Promise<ApiResponse<void>> => {
  try {
    if (!userId) throw new Error('User ID is required');
    
    const taskRef = doc(db, 'tasks', userId, 'user_tasks', taskId);
    await deleteDoc(taskRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete task'
    };
  }
};

export const getGroupedTasks = async (userId: string): Promise<ApiResponse<GroupedTasks>> => {
  try {
    const response = await getTasks(userId);
    if (!response.success || !response.data) {
      return response as unknown as ApiResponse<GroupedTasks>;
    }

    const grouped = response.data.reduce((acc: GroupedTasks, task: Task) => {
      const date = new Date(task.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {});

    return { success: true, data: grouped };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to group tasks'
    };
  }
};

export const getTasksByDate = async (
  userId: string, 
  date: string
): Promise<ApiResponse<Task[]>> => {
  try {
    if (!userId) throw new Error('User ID is required');
    
    const tasksCollection = collection(db, COLLECTION_NAME, userId);
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const q = query(
      tasksCollection,
      where('date', '>=', startOfDay.toISOString()),
      where('date', '<', endOfDay.toISOString())
    );

    const taskSnapshot = await getDocs(q);
    const tasks = taskSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));

    return { success: true, data: tasks };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tasks by date'
    };
  }
};
