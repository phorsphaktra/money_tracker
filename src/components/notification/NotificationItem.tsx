import { Task } from '../../types/task';
import { format } from 'date-fns';

interface NotificationItemProps {
  task: Task;
  type: 'overdue' | 'today' | 'upcoming';
  onClick?: (task: Task) => void;
}

export const NotificationItem = ({ task, type, onClick }: NotificationItemProps) => {
  if (!task) return null;

  const handleClick = () => {
    try {
      onClick?.(task);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
    >
      <div className="flex gap-3 items-start">
        <div className={`w-2 h-2 mt-2 rounded-full ${
          type === 'overdue' ? 'bg-red-500' :
          type === 'today' ? 'bg-amber-500' :
          'bg-blue-500'
        }`} />
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {task.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Due {format(new Date(task.dueDate), 'PPp')}
          </p>
        </div>
      </div>
    </div>
  );
};
