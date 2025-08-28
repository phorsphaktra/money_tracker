import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface RateHistory {
  rate: number;
  date: string;
  updatedBy: string;
  changePercentage?: number; // Add percentage change tracking
}

interface ExchangeRates {
  KHR_USD: number;
  history: RateHistory[];
  lastUpdated: string;
  source: 'default' | 'user' | 'system';
  averageRate?: number; // 7-day average
}

interface SettingsContextType {
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  preferences: {
    currency: string;
    language: string;
    darkMode: boolean;
    invitedMembers: string[];
    allowMemberEditAllTransactions: boolean;
  };
  updatePreferences: (newPreferences: Partial<{
    currency: string;
    language: string;
    darkMode: boolean;
    invitedMembers: string[];
    allowMemberEditAllTransactions: boolean;
  }>) => Promise<void>;
  exchangeRates: ExchangeRates;
  updateExchangeRate: (rate: number) => Promise<void>;
  isLoading: boolean;
}

const defaultExchangeRates: ExchangeRates = {
  KHR_USD: 4100,
  history: [
    {
      rate: 4100,
      date: new Date().toISOString(),
      updatedBy: 'System Default'
    }
  ],
  lastUpdated: new Date().toISOString(),
  source: 'default'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<SettingsContextType['preferences']>({
    currency: 'USD',
    language: 'en',
    darkMode: false,
    invitedMembers: [],
    allowMemberEditAllTransactions: false
  });
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(defaultExchangeRates);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserPreferences = async () => {
      if (user) {
        try {
          const userProfile = await authService.getUserProfile(user.uid);
          if (userProfile?.preferences) {
            setPreferences({
              currency: userProfile.preferences.currency ?? 'USD',
              language: userProfile.preferences.language ?? 'en',
              darkMode: userProfile.preferences.darkMode ?? false,
              invitedMembers: userProfile.preferences.invitedMembers ?? [],
              allowMemberEditAllTransactions: userProfile.preferences.allowMemberEditAllTransactions ?? false
            });
            
            // Validate and set exchange rates
            const storedRates = userProfile.preferences.exchangeRates;
            if (storedRates?.KHR_USD && storedRates.KHR_USD > 0) {
              setExchangeRates({
                ...storedRates,
                source: 'user',
                history: storedRates.history || [
                  {
                    rate: storedRates.KHR_USD,
                    date: storedRates.lastUpdated || new Date().toISOString(),
                    updatedBy: 'System Import'
                  }
                ]
              });
            }
          }
        } catch (error) {
          console.error('Failed to load preferences:', error);
          // Keep using default rates if loading fails
          setExchangeRates({
            ...defaultExchangeRates,
            source: 'default'
          });
        }
      }
      setIsLoading(false);
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

  const updateExchangeRate = async (rate: number) => {
    if (!user) return;

    try {
      const previousRate = exchangeRates.KHR_USD;
      const changePercentage = ((rate - previousRate) / previousRate) * 100;
      
      // Calculate 7-day average
      const recentRates = exchangeRates.history
        .slice(0, 7)
        .map(h => h.rate);
      const averageRate = [...recentRates, rate]
        .reduce((a, b) => a + b, 0) / (recentRates.length + 1);

      const newHistory: RateHistory = {
        rate,
        date: new Date().toISOString(),
        updatedBy: user.displayName || user.email || 'Unknown user',
        changePercentage
      };

      const newRates: ExchangeRates = {
        KHR_USD: rate,
        history: [newHistory, ...exchangeRates.history].slice(0, 30), // Keep last 30 entries
        lastUpdated: new Date().toISOString(),
        source: 'user',
        averageRate
      };

      await setDoc(
        doc(db, 'users', user.uid),
        { preferences: { exchangeRates: newRates } },
        { merge: true }
      );
      setExchangeRates(newRates);
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{
      currency: preferences.currency,
      setCurrency: async (currency) => updatePreferences({ currency }),
      preferences,
      updatePreferences,
      exchangeRates,
      updateExchangeRate,
      isLoading
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
