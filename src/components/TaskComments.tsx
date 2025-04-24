import React, { useState } from 'react';
import { TaskComment } from '../types/task';

interface TaskCommentsProps {
  taskId: string;
  comments: TaskComment[];
  onAddComment?: (taskId: string, comment: string) => void;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ 
  taskId, 
  comments = [], 
  onAddComment 
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !onAddComment) return;
    
    onAddComment(taskId, newComment);
    setNewComment('');
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="text-sm font-semibold mb-2">Comments</h4>
      <div className="space-y-2 mb-4">
        {comments.map((comment, index) => (
          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
            <p className="text-gray-600">{comment.message}</p>
            <p className="text-xs text-gray-400">
              {new Date(comment.commentAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      {onAddComment && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 text-sm p-2 border rounded"
          />
          <button 
            type="submit"
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
};
