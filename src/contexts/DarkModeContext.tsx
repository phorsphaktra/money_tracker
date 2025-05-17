import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface DarkModeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

const getInitialDarkMode = () => {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode !== null) {
    return savedMode === 'true';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const DarkModeProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      return newValue;
    });
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};
