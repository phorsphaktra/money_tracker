import { useState } from 'react';
import { TaskDetailModal } from './TaskDetailModal';
import { Task, TaskStatus } from '../../types/task';
import { TaskStatusBadge } from './TaskStatusBadge';
import { ConfirmDialog } from '../ConfirmDialog';
import { TaskModal } from './TaskModal';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export const TaskList = ({ tasks, onUpdateTask, onDeleteTask }: TaskListProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusUpdateTask, setStatusUpdateTask] = useState<{task: Task, newStatus: TaskStatus} | null>(null);

  const handleTaskClick = (task: Task, event: React.MouseEvent) => {
    // Prevent opening detail modal when clicking checkbox or buttons
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('input[type="checkbox"]')) {
      return;
    }
    setSelectedTask(task);
  };

  const handleCheckboxClick = async (event: React.MouseEvent, task: Task) => {
    event.stopPropagation(); // Prevent opening task detail modal
    try {
      setLoading(prev => ({ ...prev, [task.id]: true }));
      
      if (task.status === TaskStatus.Completed) {
        // When unchecking, revert to previous status or Initial
        await onUpdateTask(task.id, { 
          status: task.previousStatus ?? undefined,
          previousStatus: null,
          updatedAt: new Date().toISOString()
        });
      } else {
        // When checking, store current status and set to completed
        await onUpdateTask(task.id, { 
          status: TaskStatus.Completed,
          previousStatus: task.status as TaskStatus,
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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={(e) => handleTaskClick(task, e)}
            className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md 
              border border-slate-200/50 dark:border-slate-700/50
              transition-all duration-200 cursor-pointer
              ${task.status === 'completed' ? 'bg-slate-50/50 dark:bg-slate-800/50' : ''}`}
          >
            <div className={`flex items-start gap-4 p-4 ${loading[task.id] ? 'opacity-50' : ''}`}>
              <div onClick={(e) => e.stopPropagation()} className="mt-1">
                <input
                  type="checkbox"
                  checked={task.status === TaskStatus.Completed}
                  onChange={(e) => e.stopPropagation()}
                  onClick={(e) => handleCheckboxClick(e, task)}
                  disabled={loading[task.id]}
                  className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500
                    dark:border-slate-600 dark:checked:border-indigo-500
                    cursor-pointer"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium text-slate-900 dark:text-white truncate ${
                  task.status === 'completed' ? 'line-through text-slate-500 dark:text-slate-400' : ''
                }`}>
                  {task.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {task.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <TaskStatusBadge status={task.status} />
                  <span className={`px-2 py-1 rounded-lg font-medium ${
                    task.priority === 'High' ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400' :
                    task.priority === 'Medium' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Due {format(new Date(task.dueDate), 'MMM d')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            // onUpdateTask(updatedTask);
            setSelectedTask(null);
          }}
        />
      )}
    </>
  );
};
