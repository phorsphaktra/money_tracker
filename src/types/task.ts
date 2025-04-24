export type TaskStatus = 'initial' | 'in_progress' | 'review' | 'completed' | 'blocked';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface TaskComment {
  [x: string]: string | number | Date;
  id: string;
  userId: string;
  message: string;
  createdAt: string;
}

export interface Task {
  date: string | number | Date;
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
}

export interface CreateTaskDTO {
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  assignedTo: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  comments?: TaskComment[];
}

export interface TaskProject {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
}

export interface GroupedTasks {
  [date: string]: Task[];
}

export interface TasksState {
  tasks: Task[];
  projects: TaskProject[];
  currentProject?: TaskProject;
  groupedTasks: GroupedTasks;
  loading: boolean;
  error: string | null;
  filters: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: string;
    search?: string;
  };
}
