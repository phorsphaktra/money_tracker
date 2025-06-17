// import React from 'react';
// import { useTranslation } from 'react-i18next';
// import { formatUSD } from '../../utils/currencyUtils';
// import { Saving } from '../../contexts/SavingContext';

// interface MatricesCardProps {
//   savings: Saving[];
// }

// interface CategoryMetrics {
//   category: string;
//   totalAmount: number;
//   creditAmount: number;
//   debitAmount: number;
//   creditCount: number;
//   debitCount: number;
//   percentage: number;
// }

// export const MatricesCard: React.FC<MatricesCardProps> = ({ savings }) => {
//   const { t } = useTranslation();

//   const metrics = React.useMemo(() => {
//     const categoryMap: Record<string, CategoryMetrics> = {};
//     let totalSavings = 0;

//     // Calculate total savings first
//     savings.forEach(saving => {
//       totalSavings += saving.amount;
//     });

//     // Process each saving
//     savings.forEach(saving => {
//       if (!categoryMap[saving.category]) {
//         categoryMap[saving.category] = {
//           category: saving.category,
//           totalAmount: 0,
//           creditAmount: 0,
//           debitAmount: 0,
//           creditCount: 0,
//           debitCount: 0,
//           percentage: 0
//         };
//       }

//       const metrics = categoryMap[saving.category];
//       metrics.totalAmount += saving.amount;
      
//       if (saving.type === 'credit') {
//         metrics.creditAmount += saving.amount;
//         metrics.creditCount += 1;
//       } else {
//         metrics.debitAmount += saving.amount;
//         metrics.debitCount += 1;
//       }
//     });

//     // Calculate percentages and convert to array
//     return Object.values(categoryMap)
//       .map(metrics => ({
//         ...metrics,
//         percentage: (metrics.totalAmount / totalSavings) * 100
//       }))
//       .sort((a, b) => b.totalAmount - a.totalAmount);
//   }, [savings]);

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//       {metrics.map((metric) => (
//         <div
//           key={metric.category}
//           className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
//         >
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
//               {metric.category}
//             </h3>
//             <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
//               {metric.percentage.toFixed(1)}%
//             </span>
//           </div>

//           <div className="space-y-3">
//             <div>
//               <div className="flex justify-between text-sm mb-1">
//                 <span className="text-gray-500 dark:text-gray-400">{t('savings.total')}</span>
//                 <span className="font-medium text-gray-900 dark:text-gray-100">
//                   {formatUSD(metric.totalAmount)}
//                 </span>
//               </div>
//               <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-blue-600 dark:bg-blue-400 rounded-full"
//                   style={{ width: '100%' }}
//                 />
//               </div>
//             </div>

//             <div>
//               <div className="flex justify-between text-sm mb-1">
//                 <span className="text-gray-500 dark:text-gray-400">{t('savings.credits')}</span>
//                 <span className="font-medium text-green-600 dark:text-green-400">
//                   {formatUSD(metric.creditAmount)}
//                 </span>
//               </div>
//               <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-green-600 dark:bg-green-400 rounded-full"
//                   style={{ width: `${(metric.creditAmount / metric.totalAmount) * 100}%` }}
//                 />
//               </div>
//               <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
//                 {metric.creditCount} {t('savings.transactions')}
//               </span>
//             </div>

//             <div>
//               <div className="flex justify-between text-sm mb-1">
//                 <span className="text-gray-500 dark:text-gray-400">{t('savings.debits')}</span>
//                 <span className="font-medium text-red-600 dark:text-red-400">
//                   {formatUSD(metric.debitAmount)}
//                 </span>
//               </div>
//               <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-red-600 dark:bg-red-400 rounded-full"
//                   style={{ width: `${(metric.debitAmount / metric.totalAmount) * 100}%` }}
//                 />
//               </div>
//               <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
//                 {metric.debitCount} {t('savings.transactions')}
//               </span>
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }; 