import { Task } from '../../types/task';
import { format } from 'date-fns';
import { XMarkIcon, CalendarIcon, ChatBubbleLeftIcon, ClockIcon, UserGroupIcon, TagIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { TaskStatusBadge } from './TaskStatusBadge';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

export const TaskDetailModal = ({ task, onClose }: TaskDetailModalProps) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl">
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {task.title}
                </h2>
                <TaskStatusBadge status={task.status} />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <ClockIcon className="w-4 h-4" />
                <span>Created {format(new Date(task.createdAt), 'PPp')}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 
                dark:text-slate-400 dark:hover:text-slate-200
                hover:bg-slate-100 dark:hover:bg-slate-700/50"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-medium text-slate-900 dark:text-white">Description</h3>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {task.description || 'No description provided'}
              </p>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium text-slate-900 dark:text-white">Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Due {format(new Date(task.dueDate), 'PP')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Priority: <span className={`font-medium ${
                        task.priority === 'High' ? 'text-red-500' :
                        task.priority === 'Medium' ? 'text-amber-500' :
                        'text-green-500'
                      }`}>{task.priority}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChatBubbleLeftIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {task.comments?.length || 0} comments
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-slate-900 dark:text-white">Team</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Assigned to: {task.assignedTo || 'Unassigned'}
                    </span>
                  </div>
                  {task.completedBy && (
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Completed by: {task.completedBy}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            {task.comments && task.comments.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-slate-900 dark:text-white">Activity</h3>
                <div className="space-y-4">
                  {task.comments.map((comment, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        {comment.userId[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {comment.userId}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(comment.createdAt), 'PP')}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{comment.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
