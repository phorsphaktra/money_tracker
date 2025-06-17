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
    <div className={`space-y-4 ${className} bg-white-800 dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${accentColor}
          rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 text-white">
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>
        </div>
        <div className={`p-2 rounded-full bg-white/10 text-white transition-transform duration-300
          ${isExpanded ? 'rotate-180' : ''} group-hover:bg-white/20`}>
          <ChevronDownIcon className="w-4 h-4" />
        </div>
      </button>
      
      <div className={`transition-all duration-500 ease-in-out space-y-4
        ${isExpanded 
          ? 'opacity-100 max-h-[2000px] transform translate-y-0' 
          : 'opacity-0 max-h-0 overflow-hidden transform -translate-y-4'}`}>
        {children}
      </div>
    </div>
  );
}; 