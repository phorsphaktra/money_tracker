import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { supabase } from '../config/supabase';

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
      // Fetch initial profile
      (async () => {
        try {
          const { data, error } = await supabase.from('users').select('*').eq('uid', (user as any).id).limit(1).maybeSingle();
          if (error) {
            console.error('Failed to fetch user profile:', error);
            setIsLoading(false);
            return;
          }
          if (!data) {
            setIsLoading(false);
            return;
          }
          const prefs = data.preferences || {};
          setPreferences({
            currency: prefs.currency ?? 'USD',
            language: prefs.language ?? 'en',
            darkMode: prefs.darkMode ?? false,
            invitedMembers: prefs.invitedMembers ?? [],
            allowMemberEditAllTransactions: prefs.allowMemberEditAllTransactions ?? false
          });

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
        } catch (err) {
          console.error('Failed to subscribe to user preferences:', err);
        } finally {
          setIsLoading(false);
        }
      })();

      // Set up realtime subscription for the user's row
      const channel = supabase.channel(`public:users:uid=eq.${(user as any).id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `uid=eq.${(user as any).id}` }, (payload) => {
          const newData = payload.new as any;
          const prefs = newData?.preferences || {};
          setPreferences({
            currency: prefs.currency ?? 'USD',
            language: prefs.language ?? 'en',
            darkMode: prefs.darkMode ?? false,
            invitedMembers: prefs.invitedMembers ?? [],
            allowMemberEditAllTransactions: prefs.allowMemberEditAllTransactions ?? false
          });

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
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // subscribed
          }
        });
      unsubscribe = () => {
        // unsubscribe channel
        try { channel.unsubscribe(); } catch (e) { /* ignore */ }
      };
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

    // Listen for invitations owned by the user that move to 'rejected' status
    const channel = supabase.channel(`public:invitations:ownerId=eq.${(user as any).id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'invitations', filter: `ownerId=eq.${(user as any).id}` }, async (payload) => {
        const newRow = payload.new as any;
        if (newRow?.status === 'rejected') {
          const email = newRow.invitee_email || newRow.inviteeEmail;
          if (email) {
            try {
              const profile = await authService.getUserProfile((user as any).id);
              const currentPrefs = profile?.preferences || {};
              const invited = currentPrefs.invitedMembers || [];
              const updatedInvited = invited.filter((e: string) => e !== email);
              const newPrefs = { ...currentPrefs, invitedMembers: updatedInvited };
              await authService.updateUserPreferences((user as any).id, newPrefs);
            } catch (err) {
              console.error('Failed to remove rejected invitee from preferences:', err);
            }
          }
        }
      })
      .subscribe();

    return () => { try { channel.unsubscribe(); } catch (e) { /* ignore */ } };
  }, [user]);

  const updatePreferences = async (newPreferences: Partial<typeof preferences>) => {
    if (user) {
      const updatedPreferences = { ...preferences, ...newPreferences };
      await authService.updateUserPreferences((user as any).id, updatedPreferences);
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

      const displayName = (user as any).user_metadata?.full_name || (user as any).user_metadata?.name || (user as any).email;
      const newHistory: RateHistory = {
        rate,
        date: new Date().toISOString(),
        updatedBy: displayName || 'Unknown user',
        changePercentage
      };

      const newRates: ExchangeRates = {
        KHR_USD: rate,
        history: [newHistory, ...exchangeRates.history].slice(0, 30), // Keep last 30 entries
        lastUpdated: new Date().toISOString(),
        source: 'user',
        averageRate
      };

      // Merge with existing preferences and update via authService
      const profile = await authService.getUserProfile((user as any).id);
      const currentPrefs = profile?.preferences || {};
      const mergedPrefs = { ...currentPrefs, exchangeRates: newRates };
      await authService.updateUserPreferences((user as any).id, mergedPrefs);
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
