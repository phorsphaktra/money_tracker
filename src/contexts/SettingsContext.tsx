import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';

interface SettingsContextType {
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  preferences: {
    currency: string;
    language: string;
    darkMode: boolean;
  };
  updatePreferences: (newPreferences: Partial<{
    currency: string;
    language: string;
    darkMode: boolean;
  }>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    language: 'en',
    darkMode: false
  });

  useEffect(() => {
    const loadUserPreferences = async () => {
      if (user) {
        const userProfile = await authService.getUserProfile(user.uid);
        if (userProfile?.preferences) {
          setPreferences({
            currency: userProfile.preferences.currency ?? 'USD',
            language: userProfile.preferences.language?? 'en',
            darkMode: userProfile.preferences.darkMode ?? false
          });
        }
      }
    };
    loadUserPreferences();
  }, [user]);

  const updatePreferences = async (newPreferences: Partial<typeof preferences>) => {
    if (user) {
      const updatedPreferences = { ...preferences, ...newPreferences };
      await authService.updateUserPreferences(user.uid, updatedPreferences);
      setPreferences(updatedPreferences);
    }
  };

  return (
    <SettingsContext.Provider value={{
      currency: preferences.currency,
      setCurrency: async (currency) => updatePreferences({ currency }),
      preferences,
      updatePreferences
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
