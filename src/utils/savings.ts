export interface SavingsCategory {
  id: string;
  label: string;
  percentage: number;
  color: string;
}

export const SAVINGS_CATEGORIES: SavingsCategory[] = [
  { id: 'yearly-saving', label: 'Yearly Saving', percentage: 40, color: '#22C55E' },
  { id: 'public-event', label: 'Public Event', percentage: 15, color: '#6366F1' },
  { id: 'healthy', label: 'Healthy', percentage: 20, color: '#EC4899' },
  { id: 'travel', label: 'Travel', percentage: 10, color: '#F59E0B' },
  { id: 'accessory', label: 'Accessory', percentage: 15, color: '#8B5CF6' }
];

export const calculateSavingsBreakdown = (netIncome: number) => {
  return SAVINGS_CATEGORIES.map(category => ({
    ...category,
    amount: (netIncome * (category.percentage / 100))
  }));
};
