export enum TaskStatus {
  Initial = 'initial',
  InProgress = 'in_progress',
  Review = 'review',
  Completed = 'completed',
  Blocked = 'blocked'
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

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
  status: string;
  priority: string;
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
  description?: string; // Added description property
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: string[];
  status: string;
  color?: string; // Added color property
  type?: string; // Added type property
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

export interface TaskFilters {
  status: string;
  priority: string;
  search: string;
  assignedTo: string;
  dueDate: Date | null;
}
