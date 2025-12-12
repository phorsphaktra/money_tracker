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
  { id: 'yearly-saving', label: 'Yearly Saving', percentage: 40, color: '#22C55E' },
  { id: 'public-event', label: 'Public Event', percentage: 15, color: '#6366F1' },
  { id: 'healthy', label: 'Healthy', percentage: 20, color: '#EC4899' },
  { id: 'travel', label: 'Travel', percentage: 10, color: '#F59E0B' },
  { id: 'accessory', label: 'Accessory', percentage: 15, color: '#8B5CF6' },
  { id: 'goal-saving', label: 'Goal Saving', percentage: 100, color: '#8B5CF6' }
];

export interface SavingWithCategory {
  id: string;
  amount: number;
  categoryId?: string;
  date: string;
}

export const calculateSavingsBreakdown = (savings: SavingWithCategory[]): SavingsBreakdown[] => {
  // Calculate total savings
  const totalSavings = savings.reduce((sum, saving) => sum + saving.amount, 0);

  // Initialize category totals
  const categoryTotals = new Map<string, number>();
  SAVINGS_CATEGORIES.forEach(cat => categoryTotals.set(cat.id, 0));

  // First, allocate savings with specific categories
  const unallocatedSavings = savings.reduce((unallocated, saving) => {
    if (saving.categoryId) {
      const current = categoryTotals.get(saving.categoryId) || 0;
      categoryTotals.set(saving.categoryId, current + saving.amount);
      return unallocated;
    }
    return unallocated + saving.amount;
  }, 0);

  // Then, distribute unallocated savings according to percentages
  if (unallocatedSavings > 0) {
    SAVINGS_CATEGORIES.forEach(category => {
      const autoAllocated = unallocatedSavings * (category.percentage / 100);
      const current = categoryTotals.get(category.id) || 0;
      categoryTotals.set(category.id, current + autoAllocated);
    });
  }

  // Calculate breakdown for each category
  return SAVINGS_CATEGORIES.map(category => {
    const actualAmount = categoryTotals.get(category.id) || 0;
    const targetAmount = totalSavings * (category.percentage / 100);
    const progress = Math.min((actualAmount / targetAmount) * 100, 100);

    return {
      ...category,
      targetAmount,
      actualAmount,
      progress
    };
  });
};
