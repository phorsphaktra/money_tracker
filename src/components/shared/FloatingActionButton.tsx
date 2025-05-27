import { useState } from 'react';
import { TransactionModal } from '../transaction/TransactionModal';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  icon?: React.ReactNode;
}

export const FloatingActionButton = ({ 
  onClick, 
  label = 'Add',
  position = 'bottom-right',
  icon
}: FloatingActionButtonProps) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses[position]} w-16 h-16 flex items-center justify-center
        bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-full
        shadow-lg hover:shadow-2xl transform hover:scale-110
        transition-all duration-200 ease-in-out
        text-white z-40 group
        before:content-[''] before:absolute before:inset-0
        before:rounded-full before:bg-indigo-600 before:animate-pulse
        before:opacity-40 before:z-[-1]
        sm:w-14 sm:h-14`}
      aria-label={label}
    >
      <div className="relative flex items-center justify-center">
        {icon ? (
          <div className="transform transition-transform duration-200 group-hover:rotate-90">
            {icon}
          </div>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 sm:h-6 sm:w-6 transform transition-transform duration-200 group-hover:rotate-90" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
        )}
        
        {/* Tooltip */}
        <span className="absolute right-full mr-3 bg-gray-900 text-white px-3 py-2
          rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100
          transition-opacity duration-200 pointer-events-none
          before:content-[''] before:absolute before:left-full before:top-1/2
          before:-translate-y-1/2 before:border-8 before:border-transparent
          before:border-l-gray-900">
          {label}
        </span>
      </div>
    </button>
  );
};

export const FloatingActionButtonWrapper = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <FloatingActionButton onClick={() => setIsModalOpen(true)} />
      
      {isModalOpen && (
        <TransactionModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};
