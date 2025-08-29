import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, getRedirectResult } from 'firebase/auth';
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
    login: (email: string, password: string) => Promise<User | null>;
    register: (email: string, password: string, displayName: string) => Promise<User | null>;
    loginWithGoogle: () => Promise<User | null>;
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
    
    const activityTimeoutRef = useRef<number | null>(null);
    const refreshIntervalRef = useRef<number | null>(null);
    const clearErrorTimeoutRef = useRef<number | null>(null);

    /**
     * Clears any displayed error messages
     */
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    /**
     * Handles authentication errors and displays them to the user
     * Auto-clears errors after 5 seconds
     */
    const handleError = useCallback((error: Error) => {
        // Map common Firebase errors to friendlier messages
        let errorMessage = 'An unexpected error occurred';
        if (error && (error as any).code) {
            const code = (error as any).code as string;
            if (code.includes('auth/email-already-in-use')) errorMessage = 'Email already in use';
            else if (code.includes('auth/invalid-email')) errorMessage = 'Invalid email address';
            else if (code.includes('auth/wrong-password')) errorMessage = 'Invalid credentials';
            else if (code.includes('auth/user-not-found')) errorMessage = 'User not found';
            else errorMessage = (error as any).message || String(error);
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        setState(prev => ({ 
            ...prev, 
            error: errorMessage,
            loading: false 
        }));
        // Auto-clear error after 5 seconds (clear previous timer if any)
        if (clearErrorTimeoutRef.current) {
            clearTimeout(clearErrorTimeoutRef.current);
        }
        clearErrorTimeoutRef.current = window.setTimeout(() => clearError(), 5000) as unknown as number;
    }, [clearError]);

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
                activityTimeoutRef.current = null;
            }
            // clear token refresh interval
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
            // reset state
            setState({ user: null, loading: false, isAuthenticated: false, error: null });
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
        // Process redirect result (if any) once on mount so redirect-based
        // Google sign-in can create the user profile server-side.
        (async () => {
            try {
                const redirectResult = await getRedirectResult(auth);
                if (redirectResult && redirectResult.user) {
                    // Ensure profile exists for redirected user
                    await authService.handleGoogleLogin(redirectResult.user);
                }
            } catch (err) {
                // If there was no redirect result this will often throw - ignore
                // non-fatal errors but surface others.
                if ((err as any)?.code && !(String(err).includes('no-auth-event')) ) {
                    console.error('Redirect sign-in result handling failed', err);
                }
            }
        })();

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setState(prev => ({
                ...prev,
                user,
                isAuthenticated: !!user,
                loading: false
            }));

            // clear any existing interval whenever auth state changes
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }

            if (user) {
                try {
                    await authService.updateLastLogin(user.uid);
                    // Set up token refresh interval
                    refreshIntervalRef.current = window.setInterval(refreshToken, TOKEN_REFRESH_INTERVAL) as unknown as number;
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
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
            if (clearErrorTimeoutRef.current) {
                clearTimeout(clearErrorTimeoutRef.current);
                clearErrorTimeoutRef.current = null;
            }
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
            const result = await authService.loginWithEmail(email, password);
            clearError();
            return result ? (result as any).user ?? null : null;
        } catch (error) {
            handleError(error as Error);
            return null;
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
            activityTimeoutRef.current = null;
        }

        if (state.isAuthenticated) {
            activityTimeoutRef.current = window.setTimeout(async () => {
                await authService.logout();
            }, INACTIVITY_TIMEOUT) as unknown as number;
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
            const user = await authService.registerWithProfile(email, password, displayName);
            resetActivityTimer();
            clearError();
            return user ?? null;
        } catch (error) {
            handleError(error as Error);
            return null;
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
            const user = await authService.loginWithGoogle();
            resetActivityTimer();
            clearError();
            return user ?? null;
        } catch (error) {
            handleError(error as Error);
            return null;
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

    // Always render the provider so children can safely call useAuth.
    // While loading, show a minimal full-screen spinner so the app doesn't try
    // to render protected routes/components before auth state is ready.
    return (
        <AuthContext.Provider value={value}>
            {state.loading ? (
                <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
            ) : (
                children
            )}
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
