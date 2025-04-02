import { CategoryType } from '../../utils/categories';

interface CategorySelectProps {
  categories: CategoryType[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const CategorySelect = ({ categories, value, onChange, error }: CategorySelectProps) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        Category
      </label>
      <div className="grid grid-cols-2 gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors
              ${value === category.id 
                ? `${category.color.bg} ${category.color.text} border-transparent` 
                : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${category.color.bg} ${category.color.text}`}>
              {category.label.charAt(0)}
            </div>
            <span className="text-sm font-medium">
              {category.label}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};
