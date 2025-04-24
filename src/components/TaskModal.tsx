import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types/task';

interface TaskModalProps {
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => Promise<void>;
  projectMembers: string[];
  projectId: string;
  initialStatus?: TaskStatus;
  initialPriority?: TaskPriority;
  task?: Task;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  onClose,
  onSubmit,
  projectMembers,
  projectId,
  initialStatus = 'initial',
  initialPriority = 'Medium',
  task
}) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || initialPriority,
    status: task?.status || initialStatus,
    assignedTo: task?.assignedTo || '',
    dueDate: task?.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    projectId: projectId // Only use the passed projectId
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    if (!projectId) {
      setError('Project ID is required');
      setIsSubmitting(false);
      return;
    }

    const taskData: Partial<Task> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      status: formData.status,
      assignedTo: formData.assignedTo,
      dueDate: new Date(formData.dueDate).toISOString(),
      projectId: projectId,
      createdAt: task?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setLoading(true);
    try {
      await onSubmit(taskData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{task ? 'Edit Task' : 'New Task'}</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isSubmitting}>✕</button>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Task title"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            />

            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Task description"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 h-32"
              disabled={isSubmitting}
            />

            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}
                className="p-2 border rounded"
                disabled={isSubmitting}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>

              <select
                value={formData.assignedTo}
                onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                className="p-2 border rounded"
                disabled={isSubmitting}
              >
                <option value="">Assign to...</option>
                {projectMembers.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>

              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({...formData, dueDate: e.target.value})}
                className="p-2 border rounded"
                required
                disabled={isSubmitting}
              />

              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as TaskStatus})}
                className="p-2 border rounded"
                disabled={isSubmitting}
              >
                <option value="initial">Initial</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
