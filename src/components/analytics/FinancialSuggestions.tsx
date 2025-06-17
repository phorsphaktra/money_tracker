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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <ScaleIcon className="w-6 h-6 text-indigo-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Insights</h3>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              suggestion.type === 'warning'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : suggestion.type === 'info'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            }`}
          >
            <p className="font-medium">{suggestion.message}</p>
            {suggestion.action && (
              <p className="mt-1 text-sm opacity-80">{suggestion.action}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 