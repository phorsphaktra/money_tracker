import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Saving, savingService } from '../services/savingService';
import { useAuth } from './AuthContext';
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
  loadSavings: () => Promise<void>;
  loadSavingsByType: (type: 'credit' | 'debit') => Promise<void>;
  addSaving: (saving: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSaving: (id: string, saving: Partial<Saving>) => Promise<void>;
  deleteSaving: (id: string) => Promise<void>;
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

  const loadSavings = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [savings, summary] = await Promise.all([
        savingService.getAllSavings(user.uid),
        savingService.getSavingsSummary(user.uid)
      ]);
      dispatch({ type: 'SET_SAVINGS', payload: savings });
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load savings' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  const loadSavingsByType = useCallback(async (type: 'credit' | 'debit') => {
    if (!user?.uid) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [savings, summary] = await Promise.all([
        savingService.getSavingsByType(user.uid, type),
        savingService.getSavingsSummary(user.uid)
      ]);
      dispatch({ type: 'SET_SAVINGS', payload: savings });
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load ${type} savings` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  const addSaving = useCallback(async (saving: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newSaving = await savingService.addSaving(user.uid, saving);
      if (Array.isArray(newSaving)) {
        dispatch({ type: 'SET_SAVINGS', payload: newSaving });
      } else {
        dispatch({ type: 'ADD_SAVING', payload: newSaving });
      }
      // Update summary after adding
      const summary = await savingService.getSavingsSummary(user.uid);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add saving' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  const updateSaving = useCallback(async (id: string, saving: Partial<Saving>) => {
    if (!user?.uid) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedSaving = await savingService.updateSaving(user.uid, id, saving);
      dispatch({ type: 'UPDATE_SAVING', payload: updatedSaving });
      // Update summary after updating
      const summary = await savingService.getSavingsSummary(user.uid);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update saving' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  const deleteSaving = useCallback(async (id: string) => {
    if (!user?.uid) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await savingService.deleteSaving(user.uid, id);
      dispatch({ type: 'DELETE_SAVING', payload: id });
      // Update summary after deleting
      const summary = await savingService.getSavingsSummary(user.uid);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete saving' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  return (
    <SavingContext.Provider value={{ 
      state, 
      loadSavings,
      loadSavingsByType,
      addSaving, 
      updateSaving, 
      deleteSaving 
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