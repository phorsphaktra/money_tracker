import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { TaskDetailModal } from './TaskDetailModal';
import { Task, TaskStatus } from '../../types/task';
import { ConfirmDialog } from '../ConfirmDialog';
import { TaskModal } from './TaskModal';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export const TaskList = ({ tasks, onUpdateTask, onDeleteTask }: TaskListProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusUpdateTask, setStatusUpdateTask] = useState<{task: Task, newStatus: TaskStatus} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

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

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      setLoading(prev => ({ ...prev, [task.id]: true }));
      await onUpdateTask(task.id, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setLoading(prev => ({ ...prev, [task.id]: false }));
    }
  };

  const handlePriorityChange = async (task: Task, newPriority: string) => {
    try {
      setLoading(prev => ({ ...prev, [task.id]: true }));
      await onUpdateTask(task.id, {
        priority: newPriority,
        updatedAt: new Date().toISOString()
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update priority');
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
    <div className="space-y-3 sm:space-y-4">
      {/* Search Input with improved mobile handling */}
      <div className="relative">
        <input
          type="search"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl 
            border border-slate-200 dark:border-slate-700/50 
            bg-white dark:bg-slate-800/50 focus:ring-2 
            focus:ring-indigo-500/50 outline-none
            placeholder-slate-400 dark:placeholder-slate-500
            min-h-[44px] touch-manipulation"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 
          w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
      </div>

      {/* Empty State with responsive design */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-6 sm:py-8 md:py-12">
          <div className="text-slate-400 dark:text-slate-500 px-4">
            <svg className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" 
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-sm sm:text-base">
              {searchQuery ? 'No tasks found matching your search' : 'No tasks yet'}
            </p>
            {!searchQuery && (
              <p className="mt-1 text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                Create your first task to get started
              </p>
            )}
          </div>
        </div>
      )}

      {/* Task List with improved spacing */}
      <div className="grid gap-2 sm:gap-3">
        {filteredTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            loading={loading[task.id] || false}
            onTaskClick={(e) => handleTaskClick(task, e)}
            onCheckboxClick={(e) => handleCheckboxClick(e, task)}
            onStatusChange={(status) => handleStatusChange(task, status)}
            onPriorityChange={(priority) => handlePriorityChange(task, priority)}
            onEdit={() => setEditingTask(task)}
            onDelete={() => setDeleteConfirm(task.id)}
          />
        ))}
      </div>

      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 mobile-modal-backdrop p-3 sm:p-4 overflow-y-auto safe-area-inset-top safe-area-inset-bottom">
          <div className="w-full max-w-[95vw] sm:max-w-lg mx-auto">
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
          </div>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 mobile-modal-backdrop p-3 sm:p-4 overflow-y-auto safe-area-inset-top safe-area-inset-bottom">
          <div className="w-full max-w-[95vw] sm:max-w-lg mx-auto">
            <TaskDetailModal
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onUpdate={() => {
                // onUpdateTask(updatedTask);
                setSelectedTask(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
