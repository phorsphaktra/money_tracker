import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface CardGroupProps {
  title: string;
  icon: React.ElementType;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}

export const CardGroup: React.FC<CardGroupProps> = ({
  title,
  icon: Icon,
  defaultExpanded = true,
  children,
  className = '',
  accentColor = 'from-indigo-500 to-indigo-600'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`space-y-3 sm:space-y-4 ${className} bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r ${accentColor}
          rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group min-h-[44px] touch-manipulation`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-white/10 text-white flex-shrink-0">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-white truncate">
            {title}
          </h2>
        </div>
        <div className={`p-1.5 sm:p-2 rounded-full bg-white/10 text-white transition-transform duration-300 flex-shrink-0
          ${isExpanded ? 'rotate-180' : ''} group-hover:bg-white/20`}>
          <ChevronDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
      </button>
      
      <div className={`transition-all duration-500 ease-in-out space-y-3 sm:space-y-4
        ${isExpanded 
          ? 'opacity-100 max-h-[2000px] transform translate-y-0' 
          : 'opacity-0 max-h-0 overflow-hidden transform -translate-y-4'}`}>
        {children}
      </div>
    </div>
  );
}; 