interface CardStatsProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
}

export const CardStats = ({ title, value, trend, isPositive }: CardStatsProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col space-y-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        </div>
      </div>
    </div>
  );
};
