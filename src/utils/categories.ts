export interface CategoryType {
  id: string;
  label: string;
  color: {
    bg: string;
    text: string;
  };
  icon?: string;
}

export const EXPENSE_CATEGORIES: CategoryType[] = [
  {
    id: 'food-drinks',
    label: 'Food & Drinks',
    color: { bg: 'bg-orange-100', text: 'text-orange-600' }
  },
  {
    id: 'transport',
    label: 'Transport',
    color: { bg: 'bg-blue-100', text: 'text-blue-600' }
  },
  {
    id: 'shopping',
    label: 'Shopping',
    color: { bg: 'bg-pink-100', text: 'text-pink-600' }
  },
  {
    id: 'bills',
    label: 'Bills',
    color: { bg: 'bg-purple-100', text: 'text-purple-600' }
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    color: { bg: 'bg-yellow-100', text: 'text-yellow-600' }
  },
  {
    id: 'health',
    label: 'Health',
    color: { bg: 'bg-red-100', text: 'text-red-600' }
  },
  {
    id: 'education',
    label: 'Education',
    color: { bg: 'bg-indigo-100', text: 'text-indigo-600' }
  },
  {
    id: 'other-expense',
    label: 'Other',
    color: { bg: 'bg-gray-100', text: 'text-gray-600' }
  }
];

export const INCOME_CATEGORIES: CategoryType[] = [
  {
    id: 'salary',
    label: 'Salary',
    color: { bg: 'bg-green-100', text: 'text-green-600' }
  },
  {
    id: 'investment',
    label: 'Investment',
    color: { bg: 'bg-purple-100', text: 'text-purple-600' }
  },
  {
    id: 'business',
    label: 'Business',
    color: { bg: 'bg-indigo-100', text: 'text-indigo-600' }
  },
  {
    id: 'gift',
    label: 'Gift',
    color: { bg: 'bg-pink-100', text: 'text-pink-600' }
  },
  {
    id: 'other-income',
    label: 'Other',
    color: { bg: 'bg-gray-100', text: 'text-gray-600' }
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
