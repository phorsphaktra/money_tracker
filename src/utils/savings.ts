export interface SavingsCategory {
  id: string;
  label: string;
  percentage: number;
  color: string;
}

export interface SavingsBreakdown extends SavingsCategory {
  targetAmount: number;
  actualAmount: number;
  progress: number;
}

export const SAVINGS_CATEGORIES: SavingsCategory[] = [
  { id: 'public_event', label: 'Public Event', percentage: 30, color: '#6366F1' },
  { id: 'health_care', label: 'Health Care', percentage: 35, color: '#48ec63ff' },
  { id: 'travel', label: 'Travel', percentage: 15, color: '#F59E0B' },
  { id: 'accessory', label: 'Accessory', percentage: 15, color: '#8B5CF6' },
  { id: 'other', label: 'Other', percentage: 5, color: '#f65cf1ff' },
  // { id: 'goal_saving', label: 'Goal Saving', percentage: 100, color: '#f65c5cff' }
];

export const GOAL_SAVINGS_CATEGORIES: SavingsCategory[] = [
  { id: 'goal_saving', label: 'Goal Saving', percentage: 100, color: '#f65c5cff' },
];

export interface SavingWithCategory {
  id: string;
  amount: number;
  categoryId?: string;
  date: string;
}

export type SavingsGroup = 'regular' | 'goal' | 'all';

export const getSavingsCategories = (group: SavingsGroup = 'regular'): SavingsCategory[] => {
  if (group === 'regular') return SAVINGS_CATEGORIES;
  if (group === 'goal') return GOAL_SAVINGS_CATEGORIES;
  return [...SAVINGS_CATEGORIES, ...GOAL_SAVINGS_CATEGORIES];
};

export const calculateSavingsBreakdown = (
  savings: SavingWithCategory[],
  categories: SavingsCategory[] = SAVINGS_CATEGORIES
): SavingsBreakdown[] => {
  // Calculate total savings
  const totalSavings = savings.reduce((sum, saving) => sum + saving.amount, 0);

  // Initialize category totals
  const categoryTotals = new Map<string, number>();
  categories.forEach(cat => categoryTotals.set(cat.id, 0));

  // First, allocate savings with specific categories
  const unallocatedSavings = savings.reduce((unallocated, saving) => {
    if (saving.categoryId) {
      // Only add to totals if category exists in the provided categories set
      if (categoryTotals.has(saving.categoryId)) {
        const current = categoryTotals.get(saving.categoryId) || 0;
        categoryTotals.set(saving.categoryId, current + saving.amount);
      } else {
        // If category not found in the current set, treat as unallocated
        return unallocated + saving.amount;
      }
      return unallocated;
    }
    return unallocated + saving.amount;
  }, 0);

  // Then, distribute unallocated savings according to percentages
  if (unallocatedSavings > 0) {
    categories.forEach(category => {
      const autoAllocated = unallocatedSavings * (category.percentage / 100);
      const current = categoryTotals.get(category.id) || 0;
      categoryTotals.set(category.id, current + autoAllocated);
    });
  }

  // Calculate breakdown for each category
  return categories.map(category => {
    const actualAmount = categoryTotals.get(category.id) || 0;
    const targetAmount = totalSavings * (category.percentage / 100);
    const progress = targetAmount === 0 ? 0 : Math.min((actualAmount / targetAmount) * 100, 100);

    return {
      ...category,
      targetAmount,
      actualAmount,
      progress
    };
  });
};
