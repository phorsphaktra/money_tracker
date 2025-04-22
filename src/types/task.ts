export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
}

export interface CreateTaskDTO {
  title: string;
  description: string;
  completed?: boolean;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  completed?: boolean;
  date?: string;
}

export interface GroupedTasks {
  [date: string]: Task[];
}

export interface TasksState {
  tasks: Task[];
  groupedTasks: GroupedTasks;
  loading: boolean;
  error: string | null;
}
