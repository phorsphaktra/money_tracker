import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/authService';

interface AuthState {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        isAuthenticated: false,
        error: null
    });

    const handleError = useCallback((error: Error) => {
        setState(prev => ({ ...prev, error: error.message }));
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setState(prev => ({
                ...prev,
                user,
                isAuthenticated: !!user,
                loading: false
            }));

            if (user) {
                try {
                    await authService.updateLastLogin(user.uid);
                } catch (error) {
                    console.error('Failed to update last login:', error);
                }
            }
        });

        return unsubscribe;
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            await authService.loginWithEmail(email, password);
            clearError();
        } catch (error) {
            handleError(error as Error);
        }
    }, [clearError, handleError]);

    const value = {
        ...state,
        login,
        register: async (email: string, password: string, displayName: string) => {
            try {
                await authService.registerWithProfile(email, password, displayName);
                clearError();
            } catch (error) {
                handleError(error as Error);
            }
        },
        loginWithGoogle: async () => {
            try {
                await authService.loginWithGoogle();
                clearError();
            } catch (error) {
                handleError(error as Error);
            }
        },
        logout: async () => {
            try {
                await authService.logout();
                clearError();
            } catch (error) {
                handleError(error as Error);
            }
        },
        clearError
    };

    if (state.loading) {
        return null; // or loading component
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
