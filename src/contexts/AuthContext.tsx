import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
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

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        isAuthenticated: false,
        error: null
    });
    
    const activityTimeoutRef = useRef<NodeJS.Timeout>();

    const handleError = useCallback((error: Error) => {
        setState(prev => ({ ...prev, error: error.message }));
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
            clearError();
        } catch (error) {
            handleError(error as Error);
        }
    }, [clearError, handleError]);

    const refreshToken = useCallback(async () => {
        if (state.user) {
            try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    await currentUser.getIdToken(true);
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
                // Force logout if token refresh fails
                await logout();
            }
        }
    }, [state.user, logout]);

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
                    // Set up token refresh interval
                    const refreshInterval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
                    return () => clearInterval(refreshInterval);
                } catch (error) {
                    if (error instanceof Error && error.message.includes('auth/id-token-expired')) {
                        await logout();
                        handleError(new Error('Your session has expired. Please login again.'));
                    } else {
                        console.error('Failed to update last login:', error);
                    }
                }
            }
        });

        return () => {
            unsubscribe();
        };
    }, [refreshToken, logout, handleError]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            await authService.loginWithEmail(email, password);
            clearError();
        } catch (error) {
            if (error instanceof Error && error.message.includes('auth/id-token-expired')) {
                handleError(new Error('Your session has expired. Please login again.'));
            } else {
                handleError(error as Error);
            }
        }
    }, [clearError, handleError]);

    const resetActivityTimer = useCallback(() => {
        if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
        }
        
        if (state.isAuthenticated) {
            activityTimeoutRef.current = setTimeout(async () => {
                await authService.logout();
            }, INACTIVITY_TIMEOUT);
        }
    }, [state.isAuthenticated]);

    useEffect(() => {
        const activities = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        
        const handleActivity = () => {
            resetActivityTimer();
        };

        activities.forEach(activity => {
            document.addEventListener(activity, handleActivity);
        });

        // Initial timer setup
        resetActivityTimer();

        return () => {
            activities.forEach(activity => {
                document.removeEventListener(activity, handleActivity);
            });
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
        };
    }, [resetActivityTimer]);



    const value = {
        ...state,
        login,
        register: async (email: string, password: string, displayName: string) => {
            try {
                await authService.registerWithProfile(email, password, displayName);
                resetActivityTimer();
                clearError();
            } catch (error) {
                handleError(error as Error);
            }
        },
        loginWithGoogle: async () => {
            try {
                await authService.loginWithGoogle();
                resetActivityTimer();
                clearError();
            } catch (error) {
                handleError(error as Error);
            }
        },
        logout,
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
