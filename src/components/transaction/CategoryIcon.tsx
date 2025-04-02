interface CategoryIconProps {
  category: string;
}

export const CategoryIcon = ({ category }: CategoryIconProps) => {
  const getIconClass = () => {
    switch (category.toLowerCase()) {
      case 'food': return 'bg-orange-100 text-orange-600';
      case 'transport': return 'bg-blue-100 text-blue-600';
      case 'shopping': return 'bg-pink-100 text-pink-600';
      case 'bills': return 'bg-purple-100 text-purple-600';
      case 'salary': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconClass()}`}>
      {category.charAt(0).toUpperCase()}
    </div>
  );
};
