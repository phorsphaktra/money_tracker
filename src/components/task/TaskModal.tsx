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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{task ? 'Edit Task' : 'New Task'}</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 min-h-[44px] min-w-[44px] touch-manipulation" 
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-1 sm:space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Task Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Enter task title"
              className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white min-h-[44px] touch-manipulation"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Enter task description"
              className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white min-h-[88px] touch-manipulation resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}
                className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white min-h-[44px] touch-manipulation"
                disabled={isSubmitting}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assign To
              </label>
              <select
                value={formData.assignedTo}
                onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white min-h-[44px] touch-manipulation"
                disabled={isSubmitting}
              >
                <option value="">Assign to...</option>
                {projectMembers.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({...formData, dueDate: e.target.value})}
                className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white min-h-[44px] touch-manipulation"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as TaskStatus})}
                className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white min-h-[44px] touch-manipulation"
                disabled={isSubmitting}
              >
                <option value="initial">Initial</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add Comments Section */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Comments</h3>
          <div className="space-y-2 max-h-40 sm:max-h-60 overflow-y-auto">
            {formData.comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white">{comment.userId}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1 text-gray-700 dark:text-gray-300">{comment.message}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white min-h-[44px] touch-manipulation"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={isSubmitting || !newComment.trim()}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50 min-h-[44px] touch-manipulation text-sm"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 sm:py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 min-h-[44px] touch-manipulation"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="px-4 py-2.5 sm:py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 min-h-[44px] touch-manipulation mobile-button mobile-active"
          >
            {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};
