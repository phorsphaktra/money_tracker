import React from 'react';
import { Task, TaskStatus } from '../../types/task';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  loading: boolean;
  onTaskClick: (e: React.MouseEvent) => void;
  onCheckboxClick: (e: React.MouseEvent) => void;
  onStatusChange: (status: TaskStatus) => void;
  onPriorityChange: (priority: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  loading,
  onTaskClick,
  onCheckboxClick,
  onStatusChange,
  onPriorityChange,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      onClick={onTaskClick}
      className={`group bg-white dark:bg-slate-800/50 rounded-xl shadow-sm 
        hover:shadow-md border border-slate-200/50 dark:border-slate-700/50
        transition-all duration-200 cursor-pointer backdrop-blur-sm
        hover:scale-[1.02] ${task.status === 'completed' ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}
    >
      <div className={`p-4 ${loading ? 'opacity-50' : ''}`}>
        <div className="flex items-start gap-4">
          <div onClick={(e) => e.stopPropagation()} 
            className="mt-1 relative group-hover:scale-110 transition-transform">
            <input
              type="checkbox"
              checked={task.status === TaskStatus.Completed}
              onChange={(e) => e.stopPropagation()}
              onClick={onCheckboxClick}
              disabled={loading}
              className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500
                dark:border-slate-600 dark:checked:border-indigo-500 cursor-pointer
                transition-all duration-200"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-slate-900 dark:text-white truncate 
              group-hover:text-indigo-600 dark:group-hover:text-indigo-400
              transition-colors duration-200 ${
                task.status === 'completed' ? 'line-through text-slate-500 dark:text-slate-400' : ''
              }`}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2
                group-hover:text-slate-600 dark:group-hover:text-slate-300">
                {task.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={task.status}
                onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
                onClick={(e) => e.stopPropagation()}
                disabled={loading}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 
                  border border-slate-200 dark:border-slate-700 
                  text-slate-700 dark:text-slate-300 cursor-pointer
                  focus:ring-2 focus:ring-indigo-500/50 outline-none
                  hover:border-indigo-500/50 dark:hover:border-indigo-500/50
                  transition-all duration-200"
              >
                {Object.values(TaskStatus).map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>

              <select
                value={task.priority}
                onChange={(e) => onPriorityChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                disabled={loading}
                className={`text-xs px-2.5 py-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 
                  border cursor-pointer transition-all duration-200
                  hover:border-indigo-500/50 dark:hover:border-indigo-500/50
                  ${task.priority === 'High' 
                    ? 'border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400' 
                    : task.priority === 'Medium'
                    ? 'border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400'
                    : 'border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400'}`}
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>

              <span className="text-xs px-2.5 py-1.5 text-slate-500 dark:text-slate-400 
                bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 
                dark:border-slate-700/50">
                Due {format(new Date(task.dueDate), 'MMM d')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-slate-500 rounded-full" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
