import { CategoryType } from '../../utils/categories';

interface CategoryIconProps {
  category: CategoryType;
}

export const CategoryIcon = ({ category }: CategoryIconProps) => {
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${category.color.bg} ${category.color.text}`}>
      <span className="text-sm font-medium">
        {category.label.charAt(0)}
      </span>
    </div>
  );
};
