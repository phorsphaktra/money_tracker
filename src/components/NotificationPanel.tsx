import { Task } from '../types/task';
import { format } from 'date-fns';

interface NotificationPanelProps {
  tasks: Task[];
  onClose: () => void;
}

export const NotificationPanel = ({ tasks }: NotificationPanelProps) => {
  const dueTodayTasks = tasks.filter(task => {
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return today.toDateString() === dueDate.toDateString();
  });

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg 
      border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {dueTodayTasks.length > 0 ? (
          dueTodayTasks.map(task => (
            <div key={task.id} className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 
              hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 mt-2 rounded-full bg-amber-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {task.title} is due today
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {format(new Date(task.dueDate), 'PPp')}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">
            No notifications
          </div>
        )}
      </div>
    </div>
  );
};
