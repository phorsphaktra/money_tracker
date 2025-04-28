import { useMemo } from 'react';
import { Task, TaskProject, TaskFilters } from '../types/task';

export const useTaskFilters = (
  tasks: Task[],
  filters: TaskFilters,
  selectedProject: TaskProject | null
) => {
  return useMemo(() => {
    return tasks.filter(task => {
      if (selectedProject && task.projectId !== selectedProject.id) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.assignedTo !== 'all' && task.assignedTo !== filters.assignedTo) return false;
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          task.title.toLowerCase().includes(search) ||
          task.description.toLowerCase().includes(search)
        );
      }

      if (filters.dueDate) {
        const taskDate = new Date(task.dueDate);
        const filterDate = new Date(filters.dueDate);
        return taskDate.toDateString() === filterDate.toDateString();
      }

      return true;
    });
  }, [tasks, filters, selectedProject]);
};
