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

      <div className="fixed lg:bottom-8 lg:right-20 md:bottom-2 md:right-6 bottom-4 right-4 
        flex flex-col items-end space-y-4 z-50">
        <div className={`flex flex-col items-end space-y-3 transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        >
          <button
            onClick={() => {
              setIsOpen(false);
              onAddTransaction();
            }}
            className="group flex items-center gap-2 pl-4 pr-3 py-2 
              bg-gradient-to-r from-indigo-500 to-indigo-600 
              text-white rounded-full shadow-lg hover:shadow-indigo-500/25 
              hover:translate-x-0 translate-x-12 transition-all duration-300
              md:translate-x-12 sm:translate-x-16 xs:translate-x-8
              md:hover:translate-x-0 sm:hover:translate-x-0"
          >
            <span className="text-xs sm:text-sm md:text-sm font-medium whitespace-nowrap
              max-w-0 sm:max-w-none overflow-hidden transition-all duration-300">
              {t('dashboard.add_transaction')}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full 
              bg-indigo-500 flex items-center justify-center 
              shadow-inner group-hover:scale-110 transition-transform">
              <BanknotesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onAddSaving();
            }}
            className="group flex items-center gap-2 pl-4 pr-3 py-2 
              bg-gradient-to-r from-emerald-500 to-emerald-600 
              text-white rounded-full shadow-lg hover:shadow-emerald-500/25 
              hover:translate-x-0 translate-x-12 transition-all duration-300
              md:translate-x-12 sm:translate-x-16 xs:translate-x-8
              md:hover:translate-x-0 sm:hover:translate-x-0"
          >
            <span className="text-xs sm:text-sm md:text-sm font-medium whitespace-nowrap
              max-w-0 sm:max-w-none overflow-hidden transition-all duration-300">
              {t('dashboard.add_saving')}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full 
              bg-emerald-500 flex items-center justify-center 
              shadow-inner group-hover:scale-110 transition-transform">
              <CurrencyDollarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>
          </button>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative rounded-full shadow-lg 
            transition-all duration-300 ease-in-out transform
            w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
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
              <XMarkIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white 
                transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <PlusIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white 
                transition-transform duration-300 group-hover:scale-110" />
            )}
          </div>
        </button>
      </div>
    </>
  );
}; 