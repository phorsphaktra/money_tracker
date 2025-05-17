
interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
  className?: string;
}

export const DateRangeFilter = ({
  startDate,
  endDate,
  onDateChange,
  className = ''
}: DateRangeFilterProps) => {
  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <input
        type="date"
        className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 
          dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
        value={startDate?.toISOString().split('T')[0] || ''}
        onChange={(e) => {
          const date = e.target.value ? new Date(e.target.value) : null;
          onDateChange(date, endDate);
        }}
      />
      <span className="text-gray-500">to</span>
      <input
        type="date"
        className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 
          dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
        value={endDate?.toISOString().split('T')[0] || ''}
        onChange={(e) => {
          const date = e.target.value ? new Date(e.target.value) : null;
          onDateChange(startDate, date);
        }}
      />
    </div>
  );
};
