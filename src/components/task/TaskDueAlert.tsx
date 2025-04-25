// import { Task } from '../../types/task';
// import { BellAlertIcon } from '@heroicons/react/24/outline';

// interface TaskDueAlertProps {
//   tasks: Task[];
// }

// export const TaskDueAlert = ({ tasks }: TaskDueAlertProps) => {
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const dueTasks = tasks.filter(task => {
//     const dueDate = new Date(task.dueDate);
//     dueDate.setHours(0, 0, 0, 0);
//     return dueDate.getTime() === today.getTime();
//   });

//   if (dueTasks.length === 0) return null;

//   return (
//     <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 
//       rounded-xl p-4 mb-6 animate-fade-in">
//       <div className="flex items-center gap-3">
//         <BellAlertIcon className="w-5 h-5 text-amber-500 dark:text-amber-400 animate-bell" />
//         <div className="flex-1">
//           <h3 className="font-medium text-amber-800 dark:text-amber-300">
//             Tasks Due Today
//           </h3>
//           <ul className="mt-1 text-sm text-amber-600 dark:text-amber-400">
//             {dueTasks.map(task => (
//               <li key={task.id}>{task.title}</li>
//             ))}
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// };
