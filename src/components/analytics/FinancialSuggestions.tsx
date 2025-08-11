import { ScaleIcon } from '@heroicons/react/24/outline';

interface FinancialSuggestion {
  type: 'warning' | 'info' | 'success';
  message: string;
  action?: string;
}

interface FinancialSuggestionsProps {
  suggestions: FinancialSuggestion[];
}

export const FinancialSuggestions = ({ suggestions }: FinancialSuggestionsProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700 mobile-card-hover mobile-transition">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <ScaleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 flex-shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">Financial Insights</h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`p-3 sm:p-4 rounded-lg ${
              suggestion.type === 'warning'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : suggestion.type === 'info'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            }`}
          >
            <p className="font-medium text-sm sm:text-base">{suggestion.message}</p>
            {suggestion.action && (
              <p className="mt-1 text-xs sm:text-sm opacity-80">{suggestion.action}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 