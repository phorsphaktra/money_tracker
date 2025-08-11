import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BanknotesIcon,
  PlusIcon,
  XMarkIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface FloatingActionButtonProps {
  onAddTransaction: () => void;
  onAddSaving: () => void;
}

export const FloatingActionButton = ({ onAddTransaction, onAddSaving }: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 
        flex flex-col items-end space-y-3 sm:space-y-4 z-50">
        <div className={`flex flex-col items-end space-y-2 sm:space-y-3 transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          <button
            onClick={() => {
              setIsOpen(false);
              onAddTransaction();
            }}
            className="group flex items-center gap-2 pl-3 pr-2 py-2 
              bg-gradient-to-r from-indigo-500 to-indigo-600 
              text-white rounded-full shadow-lg hover:shadow-indigo-500/25 
              transition-all duration-300 min-h-[44px] touch-manipulation
              mobile-button mobile-active"
          >
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap
              overflow-hidden transition-all duration-300">
              {t('dashboard.add_transaction')}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full 
              bg-indigo-500 flex items-center justify-center 
              shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
              <BanknotesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onAddSaving();
            }}
            className="group flex items-center gap-2 pl-3 pr-2 py-2 
              bg-gradient-to-r from-emerald-500 to-emerald-600 
              text-white rounded-full shadow-lg hover:shadow-emerald-500/25 
              transition-all duration-300 min-h-[44px] touch-manipulation
              mobile-button mobile-active"
          >
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap
              overflow-hidden transition-all duration-300">
              {t('dashboard.add_saving')}
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full 
              bg-emerald-500 flex items-center justify-center 
              shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
              <CurrencyDollarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </button>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative rounded-full shadow-lg mobile-button
            mobile-transition transform
            w-14 h-14 sm:w-16 sm:h-16
            min-h-[56px] touch-manipulation mobile-active
            ${isOpen 
              ? 'bg-gray-700 hover:bg-gray-600 rotate-45 scale-110' 
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-110'
            }`}
        >
          <div className={`absolute inset-0 rounded-full transition-opacity duration-300
            bg-gradient-to-r from-indigo-500 to-purple-600 blur-lg -z-10 opacity-50
            group-hover:opacity-75 hidden sm:block`} 
          />

          <div className="absolute inset-0 flex items-center justify-center">
            {isOpen ? (
              <XMarkIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white 
                transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <PlusIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white 
                transition-transform duration-300 group-hover:scale-110" />
            )}
          </div>
        </button>
      </div>
    </>
  );
}; 