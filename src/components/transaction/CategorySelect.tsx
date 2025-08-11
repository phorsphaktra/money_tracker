import { CategoryType } from '../../utils/categories';

interface CategorySelectProps {
  categories: CategoryType[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const CategorySelect = ({ categories, value, onChange, error }: CategorySelectProps) => {
  return (
    <div className="space-y-1 sm:space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Category
      </label>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {categories.map(category => (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={`flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border transition-colors
              min-h-[44px] touch-manipulation
              ${value === category.id 
                ? `${category.color.bg} ${category.color.text} border-transparent` 
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}
          >
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${category.color.bg} ${category.color.text} flex-shrink-0`}>
              <span className="text-xs sm:text-sm font-medium">
                {category.label.charAt(0)}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-medium truncate">
              {category.label}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
};
