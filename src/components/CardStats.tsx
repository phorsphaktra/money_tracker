interface CardStatsProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  isLoading?: boolean;
}

export const CardStats = ({ title, value, trend, isPositive, isLoading }: CardStatsProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-1">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {trend}
        </span>
        <span className="text-xs text-gray-500">vs last month</span>
      </div>
    </div>
  );
};
