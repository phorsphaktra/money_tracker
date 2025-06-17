// import React from 'react';
// import { useTranslation } from 'react-i18next';
// import { formatUSD } from '../../utils/currencyUtils';
// import { Saving } from '../../contexts/SavingContext';

// interface SavingsBreakdownProps {
//   savings: Saving[];
// }

// interface CategorySummary {
//   category: string;
//   credits: number;
//   debits: number;
//   creditCount: number;
//   debitCount: number;
// }

// export const SavingsBreakdown: React.FC<SavingsBreakdownProps> = ({ savings }) => {
//   const { t } = useTranslation();

//   const categoryBreakdown = React.useMemo(() => {
//     const breakdown: Record<string, CategorySummary> = {};

//     savings.forEach(saving => {
//       if (!breakdown[saving.category]) {
//         breakdown[saving.category] = {
//           category: saving.category,
//           credits: 0,
//           debits: 0,
//           creditCount: 0,
//           debitCount: 0
//         };
//       }

//       if (saving.type === 'credit') {
//         breakdown[saving.category].credits += saving.amount;
//         breakdown[saving.category].creditCount += 1;
//       } else {
//         breakdown[saving.category].debits += saving.amount;
//         breakdown[saving.category].debitCount += 1;
//       }
//     });

//     return Object.values(breakdown).sort((a, b) => 
//       (b.credits - b.debits) - (a.credits - a.debits)
//     );
//   }, [savings]);

//   return (
//     <div className="space-y-6">
//       <div className="overflow-x-auto">
//         <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//           <thead className="bg-gray-50 dark:bg-gray-800">
//             <tr>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                 {t('savings.category')}
//               </th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                 {t('savings.credits')}
//               </th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                 {t('savings.debits')}
//               </th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                 {t('savings.net')}
//               </th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                 {t('savings.transactions')}
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
//             {categoryBreakdown.map((category) => {
//               const net = category.credits - category.debits;
//               return (
//                 <tr key={category.category} className="hover:bg-gray-50 dark:hover:bg-gray-800">
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
//                     {category.category}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
//                     {formatUSD(category.credits)}
//                     <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
//                       ({category.creditCount})
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
//                     {formatUSD(category.debits)}
//                     <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
//                       ({category.debitCount})
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm">
//                     <span className={net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
//                       {formatUSD(net)}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
//                     {category.creditCount + category.debitCount}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }; 