export const SpendingChart = () => {
  return (
    <div className="h-64 flex items-end space-x-2">
      {[65, 45, 75, 50, 85, 70, 60].map((height, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div 
            className="w-full bg-indigo-200 rounded-t"
            style={{ height: `${height}%` }}
          >
            <div
              className="w-full bg-indigo-600 rounded-t transition-all duration-300 hover:bg-indigo-700"
              style={{ height: `${height}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 mt-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
          </span>
        </div>
      ))}
    </div>
  );
};
