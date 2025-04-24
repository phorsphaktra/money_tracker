import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc, query, where, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, TaskProject, TaskComment } from '../types/task';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface GroupedTasks {
  [date: string]: Task[];
}

interface TaskPermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isProjectMember: boolean;
}

const COLLECTION_NAME = 'tasks';

// Add permission check helper
const checkPermissions = async (userId: string, projectId: string): Promise<TaskPermissions> => {
  try {
    const projectRef = doc(db, 'tasks', userId, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    const project = projectSnap.data() as TaskProject;
    const isMember = project.members.includes(userId);
    const isOwner = project.createdBy === userId;

    return {
      canCreate: isMember,
      canUpdate: isMember,
      canDelete: isOwner,
      isProjectMember: isMember
    };
  } catch (error) {
    throw new Error('Failed to check permissions');
  }
};

const getTasksCollection = (userId: string, projectId: string) => 
  collection(db, 'tasks', userId, 'projects', projectId, 'project_tasks');

export const getTasks = async (userId: string): Promise<ApiResponse<Task[]>> => {
  try {
    if (!userId) throw new Error('User ID is required');
    
    // Get tasks from projects collection
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const taskQuery = query(tasksRef, orderBy('createdAt', 'desc'));
    const taskSnapshot = await getDocs(taskQuery);
    
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

// Update createTask with permissions
export const createTask = async (userId: string, task: Omit<Task, 'id'>): Promise<ApiResponse<string>> => {
  try {
    if (!userId) throw new Error('User ID is required');
    
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const taskData = {
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId
    };

    const docRef = await addDoc(tasksRef, taskData);
    return { success: true, data: docRef.id };
  } catch (error) {
    console.error('Error creating task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task'
    };
  }
};

// Update updateTask with permissions
export const updateTask = async (
  userId: string, 
  taskId: string, 
  projectId: string,
  updates: Partial<Task>
): Promise<ApiResponse<void>> => {
  try {
    if (!userId || !taskId || !projectId) {
      throw new Error('Missing required parameters');
    }
    
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task'
    };
  }
};

// Update deleteTask with permissions
export const deleteTask = async (
  userId: string, 
  taskId: string, 
  projectId: string
): Promise<ApiResponse<void>> => {
  try {
    if (!userId || !taskId || !projectId) {
      throw new Error('Missing required parameters');
    }
    
    const taskRef = doc(getTasksCollection(userId, projectId), taskId);
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

export const getProjects = async (userId: string): Promise<ApiResponse<TaskProject[]>> => {
  try {
    if (!userId) throw new Error('User ID is required');
    
    const projectsCollection = collection(db, 'tasks', userId, 'projects');
    const projectSnapshot = await getDocs(projectsCollection);
    
    const projects = projectSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TaskProject));

    return { success: true, data: projects };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects'
    };
  }
};

export const createProject = async (
  userId: string, 
  project: Omit<TaskProject, 'id'>
): Promise<ApiResponse<string>> => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!project.name) throw new Error('Project name is required');
    
    const now = new Date().toISOString();
    const projectData = {
      ...project,
      createdAt: now,
      updatedAt: now,
      members: project.members || [],
    };
    
    const projectsCollection = collection(db, 'tasks', userId, 'projects');
    const docRef = await addDoc(projectsCollection, projectData);

    return { success: true, data: docRef.id };
  } catch (error) {
    console.error('Error creating project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project'
    };
  }
};

export const updateProject = async (
  userId: string, 
  projectId: string, 
  updates: Partial<TaskProject>
): Promise<ApiResponse<void>> => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!projectId) throw new Error('Project ID is required');
    
    const projectRef = doc(db, 'tasks', userId, 'projects', projectId);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project'
    };
  }
};

export const deleteProject = async (
  userId: string, 
  projectId: string
): Promise<ApiResponse<void>> => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!projectId) throw new Error('Project ID is required');
    
    // Delete all tasks in the project first
    const tasksCollection = collection(db, 'tasks', userId, 'user_tasks');
    const q = query(tasksCollection, where('projectId', '==', projectId));
    const taskSnapshot = await getDocs(q);
    
    const deletePromises = taskSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);
    
    // Then delete the project
    const projectRef = doc(db, 'tasks', userId, 'projects', projectId);
    await deleteDoc(projectRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project'
    };
  }
};
