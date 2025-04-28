import { useState } from 'react';
import { TaskDetailModal } from './TaskDetailModal';
import { Task, TaskStatus } from '../../types/task';
import { TaskStatusBadge } from './TaskStatusBadge';
import { ConfirmDialog } from '../ConfirmDialog';
import { TaskModal } from './TaskModal';
import { format } from 'date-fns';
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
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      
      <div className="grid gap-2 grid-cols-1">
        {tasks.map(task => (
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
