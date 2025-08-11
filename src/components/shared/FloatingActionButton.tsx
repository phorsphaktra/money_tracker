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
    'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6',
    'bottom-left': 'bottom-4 left-4 sm:bottom-6 sm:left-6',
    'top-right': 'top-4 right-4 sm:top-6 sm:right-6',
    'top-left': 'top-4 left-4 sm:top-6 sm:left-6'
  };

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses[position]} w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center
        bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-full
        shadow-lg hover:shadow-2xl transform hover:scale-110
        transition-all duration-200 ease-in-out
        text-white z-40 group mobile-button mobile-active
        before:content-[''] before:absolute before:inset-0
        before:rounded-full before:bg-indigo-600 before:animate-pulse
        before:opacity-40 before:z-[-1]
        min-h-[56px] touch-manipulation`}
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
            className="h-6 w-6 sm:h-8 sm:w-8 transform transition-transform duration-200 group-hover:rotate-90" 
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
          before:border-l-gray-900 hidden sm:block">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 mobile-modal-backdrop p-3 sm:p-4 overflow-y-auto safe-area-inset-top safe-area-inset-bottom">
          <div className="w-full max-w-[95vw] sm:max-w-lg mx-auto">
            <TransactionModal onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};
