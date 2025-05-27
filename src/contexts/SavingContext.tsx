import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Saving, savingService } from '../services/savingService';
import { useAuth } from './AuthContext';

interface SavingState {
  savings: Saving[];
  isLoading: boolean;
  error: string | null;
}

type SavingAction = 
  | { type: 'SET_SAVINGS'; payload: Saving[] }
  | { type: 'ADD_SAVING'; payload: Saving }
  | { type: 'DELETE_SAVING'; payload: string }
  | { type: 'UPDATE_SAVING'; payload: Saving }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: SavingState = {
  savings: [],
  isLoading: false,
  error: null
};

const SavingContext = createContext<{
  state: SavingState;
  loadSavings: () => Promise<void>;
  addSaving: (saving: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSaving: (id: string, saving: Partial<Saving>) => Promise<void>;
  deleteSaving: (id: string) => Promise<void>;
} | undefined>(undefined);

const savingReducer = (state: SavingState, action: SavingAction): SavingState => {
  switch (action.type) {
    case 'SET_SAVINGS':
      return { ...state, savings: action.payload };
    case 'ADD_SAVING':
      return { ...state, savings: [...state.savings, action.payload] };
    case 'DELETE_SAVING':
      return { ...state, savings: state.savings.filter(s => s.id !== action.payload) };
    case 'UPDATE_SAVING':
      return {
        ...state,
        savings: state.savings.map(s => s.id === action.payload.id ? action.payload : s)
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export const SavingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(savingReducer, initialState);
  const { user } = useAuth();

  const loadSavings = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const savings = await savingService.getAllSavings(user.uid);
      dispatch({ type: 'SET_SAVINGS', payload: savings });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load savings' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  const addSaving = useCallback(async (saving: Omit<Saving, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newSaving = await savingService.addSaving(user.uid, saving);
      dispatch({ type: 'ADD_SAVING', payload: newSaving });
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
      await savingService.updateSaving(user.uid, id, saving);
      const updatedSaving = await savingService.getSaving(user.uid, id);
      dispatch({ type: 'UPDATE_SAVING', payload: updatedSaving });
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