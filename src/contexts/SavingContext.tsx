import React, { createContext, useContext, useReducer, useCallback, useState, useEffect } from 'react';
import { Saving, savingService } from '../services/savingService';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, limit, getDoc, doc } from 'firebase/firestore';
import { calculateSavingsBreakdown, SavingsBreakdown } from '../utils/savings';

interface SavingsSummary {
  total: number;
  credits: number;
  debits: number;
  creditCount: number;
  debitCount: number;
}

interface SavingState {
  savings: Saving[];
  savingsBreakdown: SavingsBreakdown[];
  summary: SavingsSummary;
  isLoading: boolean;
  error: string | null;
}

type SavingAction = 
  | { type: 'SET_SAVINGS'; payload: Saving[] }
  | { type: 'SET_SUMMARY'; payload: SavingsSummary }
  | { type: 'ADD_SAVING'; payload: Saving }
  | { type: 'DELETE_SAVING'; payload: string }
  | { type: 'UPDATE_SAVING'; payload: Saving }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: SavingState = {
  savings: [],
  savingsBreakdown: [],
  summary: {
    total: 0,
    credits: 0,
    debits: 0,
    creditCount: 0,
    debitCount: 0
  },
  isLoading: false,
  error: null
};

const SavingContext = createContext<{
  state: SavingState;
  loadSavings: (ownerId?: string) => Promise<void>;
  loadSavingsByType: (type: 'credit' | 'debit', ownerId?: string) => Promise<void>;
  addSaving: (saving: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSaving: (id: string, saving: Partial<Saving>) => Promise<void>;
  deleteSaving: (id: string) => Promise<void>;
  canEditOwner: (ownerId?: string) => Promise<boolean>;
  activeOwnerId?: string | null;
  switchActiveOwner: (ownerId: string) => Promise<void>;
} | undefined>(undefined);

const savingReducer = (state: SavingState, action: SavingAction): SavingState => {
  let newState = state;

  switch (action.type) {
    case 'SET_SAVINGS':
      newState = { ...state, savings: action.payload };
      break;
    case 'SET_SUMMARY':
      newState = { ...state, summary: action.payload };
      break;
    case 'ADD_SAVING':
      newState = { ...state, savings: [...state.savings, action.payload] };
      break;
    case 'DELETE_SAVING':
      newState = { ...state, savings: state.savings.filter(s => s.id !== action.payload) };
      break;
    case 'UPDATE_SAVING':
      newState = {
        ...state,
        savings: state.savings.map(s => s.id === action.payload.id ? action.payload : s)
      };
      break;
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }

  // Recalculate breakdown whenever savings change
  return {
    ...newState,
    savingsBreakdown: calculateSavingsBreakdown(newState.savings)
  };
};

export const SavingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(savingReducer, initialState);
  const { user } = useAuth();
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(user?.uid || null);

  // Initialize active owner from localStorage and prefer invited owner if present
  useEffect(() => {
    const init = async () => {
      if (!user) return;
      // Try to find an inviting owner for this user
      try {
        const invitedOwnerId = await findInvitingOwnerId(user.email || '');
        if (invitedOwnerId) {
          setActiveOwnerId(invitedOwnerId);
          localStorage.setItem('activeOwnerId', invitedOwnerId);
          await loadSavings(invitedOwnerId);
          return;
        }
      } catch (e) {
        // ignore and fall back
      }

      const stored = localStorage.getItem('activeOwnerId');
      if (stored) {
        setActiveOwnerId(stored);
        await loadSavings(stored);
      } else {
        setActiveOwnerId(user.uid);
        await loadSavings(user.uid);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Subscribe to realtime updates for savings when activeOwnerId changes
  useEffect(() => {
    if (!activeOwnerId) return;
    const unsubscribe = savingService.subscribeToSavings(activeOwnerId, (items) => {
      dispatch({ type: 'SET_SAVINGS', payload: items });
      // recalc summary
      (async () => {
        try {
          const summary = await savingService.getSavingsSummary(activeOwnerId);
          dispatch({ type: 'SET_SUMMARY', payload: summary });
        } catch (e) {
          // ignore
        }
      })();
    });

    return () => {
      try { unsubscribe(); } catch (e) { /* ignore */ }
    };
  }, [activeOwnerId]);

  const findInvitingOwnerId = async (email: string): Promise<string | null> => {
    if (!email) return null;
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('preferences.invitedMembers', 'array-contains', email),
        where('preferences.allowMemberEditAllTransactions', '==', true),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].id;
      }
      return null;
    } catch (e) {
      console.error('Failed to find inviting owner for savings:', e);
      return null;
    }
  };

  const loadSavings = useCallback(async (ownerIdParam?: string) => {
    const ownerId = ownerIdParam || activeOwnerId || user?.uid;
    if (!ownerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [savings, summary] = await Promise.all([
        savingService.getAllSavings(ownerId),
        savingService.getSavingsSummary(ownerId)
      ]);
      dispatch({ type: 'SET_SAVINGS', payload: savings });
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load savings' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, activeOwnerId]);

  const loadSavingsByType = useCallback(async (type: 'credit' | 'debit', ownerIdParam?: string) => {
    const ownerId = ownerIdParam || activeOwnerId || user?.uid;
    if (!ownerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [savings, summary] = await Promise.all([
        savingService.getSavingsByType(ownerId, type),
        savingService.getSavingsSummary(ownerId)
      ]);
      dispatch({ type: 'SET_SAVINGS', payload: savings });
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load ${type} savings` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, activeOwnerId]);

  const addSaving = useCallback(async (saving: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) => {
  const ownerId = activeOwnerId || user?.uid;
  if (!ownerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
  const savingWithMeta = { ...saving, ...(user ? { createdBy: user.uid, createdByName: user.displayName || user.email || user.uid } : {}) } as any;
  const newSaving = await savingService.addSaving(ownerId, savingWithMeta);
      if (Array.isArray(newSaving)) {
        dispatch({ type: 'SET_SAVINGS', payload: newSaving });
      } else {
        dispatch({ type: 'ADD_SAVING', payload: newSaving });
      }
      // Update summary after adding
  const summary = await savingService.getSavingsSummary(ownerId);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add saving' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  const updateSaving = useCallback(async (id: string, saving: Partial<Saving>) => {
    const ownerId = activeOwnerId || user?.uid;
    if (!ownerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedSaving = await savingService.updateSaving(ownerId, id, saving);
      dispatch({ type: 'UPDATE_SAVING', payload: updatedSaving });
      // Update summary after updating
      const summary = await savingService.getSavingsSummary(ownerId);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update saving' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, activeOwnerId]);

  const deleteSaving = useCallback(async (id: string) => {
    const ownerId = activeOwnerId || user?.uid;
    if (!ownerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await savingService.deleteSaving(ownerId, id);
      dispatch({ type: 'DELETE_SAVING', payload: id });
      // Update summary after deleting
      const summary = await savingService.getSavingsSummary(ownerId);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete saving' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, activeOwnerId]);

  const switchActiveOwner = useCallback(async (ownerId: string) => {
    setActiveOwnerId(ownerId);
    localStorage.setItem('activeOwnerId', ownerId);
    await loadSavings(ownerId);
  }, [loadSavings]);

  const canEditOwner = useCallback(async (ownerId?: string) => {
    try {
      if (!user) return false;
      const target = ownerId || activeOwnerId || user.uid;
      if (!target) return false;
      if (target === user.uid) return true;
      const userDocRef = doc(db, 'users', target);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return false;
      const data = userDocSnap.data() as any;
      const prefs = data.preferences || {};
      const allowed = !!(prefs.allowMemberEditAllTransactions === true && Array.isArray(prefs.invitedMembers) && prefs.invitedMembers.includes(user.email));
      return allowed;
    } catch (err) {
      console.warn('canEditOwner (savings) check failed', err);
      return false;
    }
  }, [user, activeOwnerId]);

  return (
    <SavingContext.Provider value={{ 
      state, 
      loadSavings,
      loadSavingsByType,
      addSaving, 
      updateSaving, 
      deleteSaving,
      canEditOwner,
      activeOwnerId,
      switchActiveOwner
    }}>
      {children}
    </SavingContext.Provider>
  );
};

export const useSaving = () => {
  const context = useContext(SavingContext);
  if (!context) {
    throw new Error('useSaving must be used within a SavingProvider');
  }
  return context;
};
export type { Saving };

