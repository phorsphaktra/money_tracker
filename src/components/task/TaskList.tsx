import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types/task';
import { TaskStatusBadge } from './TaskStatusBadge';
import { ConfirmDialog } from '../ConfirmDialog';
import { TaskModal } from './TaskModal';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdateTask, onDeleteTask }) => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusUpdateTask, setStatusUpdateTask] = useState<{task: Task, newStatus: TaskStatus} | null>(null);

  const handleStatusChange = async (task: Task) => {
    try {
      setLoading(prev => ({ ...prev, [task.id]: true }));
      
      if (task.status === TaskStatus.Completed) {
        // When unchecking, revert to previous status or Initial
        await onUpdateTask(task.id, { 
          status: task.previousStatus || TaskStatus.Initial,
          previousStatus: null, // Clear previous status
          updatedAt: new Date().toISOString()
        });
      } else {
        // When checking, store current status and set to completed
        await onUpdateTask(task.id, { 
          status: TaskStatus.Completed,
          updatedAt: new Date().toISOString()
        });
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setLoading(prev => ({ ...prev, [task.id]: false }));
    }
  };

  const handleStatusConfirm = async () => {
    if (!statusUpdateTask) return;
    const { task } = statusUpdateTask;
    
    try {
      setLoading(prev => ({ ...prev, [task.id]: true }));
      await onUpdateTask(task.id, {
        status: TaskStatus.Completed,
        updatedAt: new Date().toISOString()
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setLoading(prev => ({ ...prev, [task.id]: false }));
      setStatusUpdateTask(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      setLoading(prev => ({ ...prev, [taskId]: true }));
      await onDeleteTask(taskId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setLoading(prev => ({ ...prev, [taskId]: false }));
      setDeleteConfirm(null);
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
                onChange={() => handleStatusChange(task)}
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
                <TaskStatusBadge status={task.status} />
                <button
                  onClick={() => setEditingTask(task)}
                  className="p-2 text-gray-400 hover:text-blue-500"
                  disabled={loading[task.id]}
                >
                  ✎
                </button>
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

      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={async (updates) => {
            await onUpdateTask(editingTask.id, updates);
            setEditingTask(null);
          }}
          projectMembers={[]} // Pass actual project members
          projectId={editingTask.projectId}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Task"
        message={
          deleteConfirm 
            ? `Are you sure you want to delete "${tasks.find(t => t.id === deleteConfirm)?.title}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        loading={deleteConfirm ? loading[deleteConfirm] : false}
      />

      <ConfirmDialog
        isOpen={!!statusUpdateTask}
        onClose={() => setStatusUpdateTask(null)}
        onConfirm={handleStatusConfirm}
        title="Complete Task"
        message={
          statusUpdateTask 
            ? `Are you sure you want to mark "${statusUpdateTask.task.title}" as completed?`
            : ''
        }
        confirmLabel="Complete"
        confirmButtonClass="bg-green-500 hover:bg-green-600"
        loading={statusUpdateTask ? loading[statusUpdateTask.task.id] : false}
      />
    </>
  );
};
