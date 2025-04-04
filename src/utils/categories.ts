export interface CategoryType {
  id: string;
  label: string;
  color: {
    bg: string;
    text: string;
  };
  icon?: string;
  chartColor: string;
}

export const EXPENSE_CATEGORIES: CategoryType[] = [
  {
    id: 'food-drinks',
    label: 'Food & Drinks',
    color: { bg: 'bg-orange-100', text: 'text-orange-600' },
    chartColor: '#F97316'
  },
  {
    id: 'transport',
    label: 'Transport',
    color: { bg: 'bg-blue-100', text: 'text-blue-600' },
    chartColor: '#2563EB'
  },
  {
    id: 'shopping',
    label: 'Shopping',
    color: { bg: 'bg-pink-100', text: 'text-pink-600' },
    chartColor: '#EC4899'
  },
  {
    id: 'bills',
    label: 'Bills',
    color: { bg: 'bg-purple-100', text: 'text-purple-600' },
    chartColor: '#A855F7'
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    color: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    chartColor: '#EAB308'
  },
  {
    id: 'health',
    label: 'Health',
    color: { bg: 'bg-red-100', text: 'text-red-600' },
    chartColor: '#EF4444'
  },
  {
    id: 'education',
    label: 'Education',
    color: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    chartColor: '#6366F1'
  },
  {
    id: 'other-expense',
    label: 'Other',
    color: { bg: 'bg-gray-100', text: 'text-gray-600' },
    chartColor: '#9CA3AF'
  }
];

export const INCOME_CATEGORIES: CategoryType[] = [
  {
    id: 'salary',
    label: 'Salary',
    color: { bg: 'bg-green-100', text: 'text-green-600' },
    chartColor: '#22C55E'
  },
  {
    id: 'investment',
    label: 'Investment',
    color: { bg: 'bg-purple-100', text: 'text-purple-600' },
    chartColor: '#A855F7'
  },
  {
    id: 'business',
    label: 'Business',
    color: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    chartColor: '#6366F1'
  },
  {
    id: 'gift',
    label: 'Gift',
    color: { bg: 'bg-pink-100', text: 'text-pink-600' },
    chartColor: '#EC4899'
  },
  {
    id: 'other-income',
    label: 'Other',
    color: { bg: 'bg-gray-100', text: 'text-gray-600' },
    chartColor: '#9CA3AF'
  }
];

export type CategoryId = string;

export const getCategoryById = (id: CategoryId, type: 'income' | 'expense'): CategoryType => {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return categories.find(cat => cat.id === id) || categories[categories.length - 1];
};

export const isValidCategory = (id: string, type: 'income' | 'expense'): boolean => {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return categories.some(cat => cat.id === id);
};
