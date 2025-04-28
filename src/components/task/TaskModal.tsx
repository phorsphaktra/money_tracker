import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus, TaskComment } from '../../types/task';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || initialPriority,
    status: task?.status || initialStatus,
    assignedTo: task?.assignedTo || '',
    dueDate: task?.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    projectId: projectId, // Only use the passed projectId
    comments: task?.comments || []
  });
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;

    const comment: TaskComment = {
      id: Date.now().toString(),
      userId: user.uid,
      userName: user.displayName || user.email || 'Anonymous',
      message: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    setFormData(prev => ({
      ...prev,
      comments: [...prev.comments, comment]
    }));
    setNewComment('');
  };

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
      updatedAt: new Date().toISOString(),
      comments: formData.comments
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

          {/* Add Comments Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Comments</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {formData.comments.map(comment => (
                <div key={comment.id} className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{comment.userId}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Add Comment
              </button>
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
