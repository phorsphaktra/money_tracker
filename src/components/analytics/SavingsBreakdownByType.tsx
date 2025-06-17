// import React from 'react';
// import { useTranslation } from 'react-i18next';
// import { formatUSD } from '../../utils/currencyUtils';
// import { Saving } from '../../contexts/SavingContext';
// import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

// interface SavingsBreakdownByTypeProps {
//   savings: Saving[];
// }

// interface CategoryBreakdown {
//   categoryId: string;
//   credits: {
//     total: number;
//     count: number;
//     transactions: Saving[];
//   };
//   debits: {
//     total: number;
//     count: number;
//     transactions: Saving[];
//   };
// }

// export const SavingsBreakdownByType: React.FC<SavingsBreakdownByTypeProps> = ({ savings }) => {
//   const { t } = useTranslation();

//   const breakdown = React.useMemo(() => {
//     const categoryMap: Record<string, CategoryBreakdown> = {};

//     // Initialize categories
//     savings.forEach(saving => {
//       const categoryId = saving.categoryId || 'uncategorized';
//       if (!categoryMap[categoryId]) {
//         categoryMap[categoryId] = {
//           categoryId,
//           credits: { total: 0, count: 0, transactions: [] },
//           debits: { total: 0, count: 0, transactions: [] }
//         };
//       }
//     });

//     // Process transactions
//     savings.forEach(saving => {
//       const categoryId = saving.categoryId || 'uncategorized';
//       const category = categoryMap[categoryId];
//       if (saving.type === 'credit') {
//         category.credits.total += saving.amount;
//         category.credits.count += 1;
//         category.credits.transactions.push(saving);
//       } else {
//         category.debits.total += saving.amount;
//         category.debits.count += 1;
//         category.debits.transactions.push(saving);
//       }
//     });

//     // Sort categories by total amount (credits - debits)
//     return Object.values(categoryMap).sort((a, b) => {
//       const aTotal = a.credits.total - a.debits.total;
//       const bTotal = b.credits.total - b.debits.total;
//       return bTotal - aTotal;
//     });
//   }, [savings]);

//   const renderCategoryBreakdown = (category: CategoryBreakdown) => {
//     const netAmount = category.credits.total - category.debits.total;
//     const totalTransactions = category.credits.count + category.debits.count;

//     return (
//       <div key={category.categoryId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
//         <div className="p-4 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex items-center justify-between">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
//               {category.categoryId === 'uncategorized' ? t('savings.uncategorized') : category.categoryId}
//             </h3>
//             <span className={`text-sm font-medium ${netAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
//               {formatUSD(netAmount)}
//             </span>
//           </div>
//           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
//             {totalTransactions} {t('savings.transactions')}
//           </p>
//         </div>

//         <div className="divide-y divide-gray-200 dark:divide-gray-700">
//           {/* Credits Section */}
//           <div className="p-4">
//             <div className="flex items-center justify-between mb-2">
//               <div className="flex items-center space-x-2">
//                 <ArrowUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
//                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                   {t('savings.credits')}
//                 </span>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <span className="text-sm font-medium text-green-600 dark:text-green-400">
//                   {formatUSD(category.credits.total)}
//                 </span>
//                 <span className="text-xs text-gray-500 dark:text-gray-400">
//                   ({category.credits.count})
//                 </span>
//               </div>
//             </div>
//             <div className="space-y-2">
//               {category.credits.transactions.map(transaction => (
//                 <div key={transaction.id} className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600 dark:text-gray-300">{transaction.description}</span>
//                   <span className="text-green-600 dark:text-green-400">{formatUSD(transaction.amount)}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Debits Section */}
//           <div className="p-4">
//             <div className="flex items-center justify-between mb-2">
//               <div className="flex items-center space-x-2">
//                 <ArrowDownIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
//                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                   {t('savings.debits')}
//                 </span>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <span className="text-sm font-medium text-red-600 dark:text-red-400">
//                   {formatUSD(category.debits.total)}
//                 </span>
//                 <span className="text-xs text-gray-500 dark:text-gray-400">
//                   ({category.debits.count})
//                 </span>
//               </div>
//             </div>
//             <div className="space-y-2">
//               {category.debits.transactions.map(transaction => (
//                 <div key={transaction.id} className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600 dark:text-gray-300">{transaction.description}</span>
//                   <span className="text-red-600 dark:text-red-400">{formatUSD(transaction.amount)}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//       {breakdown.map(category => renderCategoryBreakdown(category))}
//     </div>
//   );
// }; 