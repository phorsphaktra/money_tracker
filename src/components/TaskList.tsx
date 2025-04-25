import React, { useState } from 'react';
import { Task, TaskStatus, TaskStatusTransitions } from '../types/task';
import { TaskStatusBadge } from './TaskStatusBadge';
import { ConfirmDialog } from '././ConfirmDialog';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdateTask, onDeleteTask }) => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);

  const handleCheckboxChange = async (task: Task) => {
    try {
      setLoading(prev => ({ ...prev, [task.id]: true }));
      
      const updates: Partial<Task> = {
        status: task.status === 'completed' ? (task.previousStatus || 'initial') : 'completed',
        previousStatus: task.status === 'completed' ? null : task.status,
        updatedAt: new Date().toISOString()
      };

      await onUpdateTask(task.id, updates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setLoading(prev => ({ ...prev, [task.id]: false }));
    }
  };

  const handleStatusSelect = async (task: Task, newStatus: TaskStatus) => {
    try {
      setLoading(prev => ({ ...prev, [task.id]: true }));
      setStatusMenuOpen(null);

      const updates: Partial<Task> = {
        status: newStatus,
        previousStatus: task.status === 'completed' ? null: task.status,
        updatedAt: new Date().toISOString()
      };

      await onUpdateTask(task.id, updates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setLoading(prev => ({ ...prev, [task.id]: false }));
    }
  };

  const getNextStatuses = (currentStatus: string): TaskStatus[] => {
    return TaskStatusTransitions[currentStatus as TaskStatus] || [];
  };

  const handleDelete = async (taskId: string) => {
    try {
      setLoading(prev => ({ ...prev, [taskId]: true }));
      await onDeleteTask(taskId);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="relative">
            <div className={`flex items-center gap-4 p-4 bg-white rounded-lg shadow 
              ${loading[task.id] ? 'opacity-50' : ''} 
              ${task.status === 'completed' ? 'bg-gray-50' : ''}`}
            >
              <input
                type="checkbox"
                checked={task.status === 'completed'}
                onChange={() => handleCheckboxChange(task)}
                disabled={loading[task.id]}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              
              <div className="flex-1">
                <h3 className={`text-lg font-medium ${
                  task.status === 'completed' ? 'line-through text-gray-500' : ''
                }`}>
                  {task.title}
                </h3>
                <p className="text-gray-600 text-sm">{task.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    task.priority === 'High' ? 'bg-red-100 text-red-800' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-gray-500 text-xs">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setStatusMenuOpen(statusMenuOpen === task.id ? null : task.id)}
                    disabled={loading[task.id]}
                    className="px-3 py-1 text-sm rounded-full border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <TaskStatusBadge status={task.status} />
                    <span className="ml-1">▼</span>
                  </button>
                  
                  {statusMenuOpen === task.id && (
                    <div className="absolute right-0 mt-1 py-1 w-48 bg-white rounded-md shadow-lg z-10 border">
                      {getNextStatuses(task.status).map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusSelect(task, status)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <TaskStatusBadge status={status} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setDeleteConfirm(task.id)}
                  disabled={loading[task.id]}
                  className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
                >
                  {loading[task.id] ? (
                    <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full" />
                  ) : '✕'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
    </>
  );
};
