import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { doc, setDoc, onSnapshot, collection, query, where, updateDoc, arrayRemove } from 'firebase/firestore';
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
    // Use a real-time listener so changes to the user's preferences (for example
    // invitedMembers being removed when an invitee rejects) are reflected
    // immediately in the UI without requiring a reload.
    let unsubscribe: (() => void) | undefined;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      unsubscribe = onSnapshot(userRef, (snap) => {
        if (!snap.exists()) {
          setIsLoading(false);
          return;
        }
        const userProfile = snap.data() as any;
        const prefs = userProfile.preferences || {};
        setPreferences({
          currency: prefs.currency ?? 'USD',
          language: prefs.language ?? 'en',
          darkMode: prefs.darkMode ?? false,
          invitedMembers: prefs.invitedMembers ?? [],
          allowMemberEditAllTransactions: prefs.allowMemberEditAllTransactions ?? false
        });

        // Validate and set exchange rates
        const storedRates = prefs.exchangeRates;
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
        setIsLoading(false);
      }, (err) => {
        console.error('Failed to subscribe to user preferences:', err);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Listen for invitations rejected by invitees where the current user is the owner.
  // When detected, remove the invitee email from the owner's invitedMembers (owner has write permission
  // on their own user doc so this client-side update is allowed).
  useEffect(() => {
    if (!user) return;

    const invitationsRef = collection(db, 'invitations');
    const q = query(invitationsRef, where('ownerId', '==', user.uid), where('status', '==', 'rejected'));
    const unsubInv = onSnapshot(q, async (snap) => {
      if (snap.empty) return;
      const ownerRef = doc(db, 'users', user.uid);
      for (const d of snap.docs) {
        try {
          const data = d.data() as any;
          const email = data.inviteeEmail;
          if (email) {
            await updateDoc(ownerRef, {
              'preferences.invitedMembers': arrayRemove(email)
            });
          }
        } catch (err) {
          console.error('Failed to remove rejected invitee from preferences:', err);
        }
      }
    }, (err) => console.error('Invitation listener error:', err));

    return () => unsubInv();
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
