import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/authService';

/**
 * Interface representing the authentication state
 */
interface AuthState {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

/**
 * Interface extending AuthState with authentication methods
 */
interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

// Create authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constants for session management
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // User will be logged out after 15 minutes of inactivity
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // Token refresh every 10 minutes

/**
 * AuthProvider Component
 * Manages authentication state and provides auth-related functionality to child components
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        isAuthenticated: false,
        error: null
    });
    
    const activityTimeoutRef = useRef<NodeJS.Timeout>();

    /**
     * Handles authentication errors and displays them to the user
     * Auto-clears errors after 5 seconds
     */
    const handleError = useCallback((error: Error) => {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setState(prev => ({ 
            ...prev, 
            error: errorMessage,
            loading: false 
        }));
        // Auto-clear error after 5 seconds
        setTimeout(clearError, 5000);
    }, []);

    /**
     * Clears any displayed error messages
     */
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    /**
     * Handles user logout
     * - Clears server-side token
     * - Signs out from Firebase
     * - Clears activity timeout
     */
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

    /**
     * Refreshes the Firebase ID token
     * Forces logout if token refresh fails
     */
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

    /**
     * Firebase auth state listener
     * Updates user state and handles token refresh
     */
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

    /**
     * Handles email/password login
     * - Sets loading state
     * - Attempts login
     * - Handles errors
     */
    const login = useCallback(async (email: string, password: string) => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            await authService.loginWithEmail(email, password);
            clearError();
        } catch (error) {
            handleError(error as Error);
        } finally {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [clearError, handleError]);

    /**
     * Resets the inactivity timeout
     * Logs out user after INACTIVITY_TIMEOUT duration
     */
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

    /**
     * Handles new user registration
     * - Creates user profile
     * - Sets up activity timer
     * - Handles loading states
     */
    const register = useCallback(async (email: string, password: string, displayName: string) => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            await authService.registerWithProfile(email, password, displayName);
            resetActivityTimer();
            clearError();
        } catch (error) {
            handleError(error as Error);
        } finally {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [clearError, handleError, resetActivityTimer]);

    /**
     * Handles Google OAuth login
     * - Manages loading state
     * - Sets up activity timer
     * - Handles errors
     */
    const loginWithGoogle = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            await authService.loginWithGoogle();
            resetActivityTimer();
            clearError();
        } catch (error) {
            handleError(error as Error);
        } finally {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [clearError, handleError, resetActivityTimer]);

    /**
     * Activity monitoring effect
     * Resets inactivity timer on user interaction
     */
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

    // Prepare context value with all auth methods and state
    const value = {
        ...state,
        login,
        register,
        loginWithGoogle,
        logout,
        clearError
    };

    // Show nothing while initial loading
    if (state.loading) {
        return null;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom hook to use authentication context
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
