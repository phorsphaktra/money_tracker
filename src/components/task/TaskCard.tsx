import React, { useState } from 'react';
import { Task } from '../../types/task';
import { TaskComments } from './TaskComments';

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="border rounded-lg shadow-sm hover:shadow-md transition p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{task.title}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          task.priority === 'High' ? 'bg-red-100 text-red-800' :
          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {task.priority}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-2">{task.description}</p>
      
      <div className="text-sm text-gray-500 space-y-1">
        <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
        <p>Status: {task.status}</p>
        <p>Assigned to: {task.assignedTo}</p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-blue-500 text-sm"
        >
          {showComments ? 'Hide Comments' : `Comments (${task.comments?.length || 0})`}
        </button>
      </div>

      {showComments && <TaskComments taskId={task.id} comments={task.comments} />}
    </div>
  );
};
