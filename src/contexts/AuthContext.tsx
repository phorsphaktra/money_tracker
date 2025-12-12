import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { supabase } from '../config/supabase';

// Application user shape compatible with previous Firebase usage
export interface AppUser {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    user_metadata?: any;
}

function mapSupabaseUser(su: any): AppUser {
    return {
        uid: su.id,
        email: su.email ?? null,
        displayName: su.user_metadata?.full_name ?? su.user_metadata?.name ?? null,
        photoURL: su.user_metadata?.avatar_url ?? null,
        user_metadata: su.user_metadata ?? {}
    } as AppUser;
}

/**
 * Interface representing the authentication state
 */
interface AuthState {
    user: any | null; // using `any` for now to preserve compatibility with existing code
    loading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

/**
 * Interface extending AuthState with authentication methods
 */
interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<any | null>;
    register: (email: string, password: string, displayName: string) => Promise<any | null>;
    loginWithGoogle: () => Promise<any | null>;
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
        // Supabase handles token refresh automatically in the client SDK.
        // We'll check user session validity and force logout on error.
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data.session) {
                await logout();
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            await logout();
        }
    }, [logout]);

    /**
     * Firebase auth state listener
     * Updates user state and handles token refresh
     */
    useEffect(() => {
        // Supabase OAuth redirect handling is automatic on page load; we also
        // listen to auth state changes via onAuthStateChange.
        const setup = async () => {
            // If a session already exists, set the user
                const { data } = await supabase.auth.getSession();
                const supaUser = data.session?.user ?? null;
                const mappedUser = supaUser ? mapSupabaseUser(supaUser) : null;
                setState(prev => ({ ...prev, user: mappedUser, isAuthenticated: !!mappedUser, loading: false }));
                if (supaUser) {
                    try {
                        await authService.updateLastLogin(supaUser.id);
                        refreshIntervalRef.current = window.setInterval(refreshToken, TOKEN_REFRESH_INTERVAL) as unknown as number;
                    } catch (error) {
                        console.error('Failed to update last login:', error);
                    }
                }
        };
        setup();

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const supaUser = session?.user ?? null;
            const mappedUser = supaUser ? mapSupabaseUser(supaUser) : null;
            setState(prev => ({ ...prev, user: mappedUser, isAuthenticated: !!mappedUser, loading: false }));
            // clear any existing interval whenever auth state changes
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
            if (supaUser) {
                try {
                    await authService.updateLastLogin(supaUser.id);
                    refreshIntervalRef.current = window.setInterval(refreshToken, TOKEN_REFRESH_INTERVAL) as unknown as number;
                } catch (error) {
                    console.error('Failed to update last login:', error);
                }
            }
        });

    function mapSupabaseUser(su: any): AppUser {
        return {
            uid: su.id,
            email: su.email ?? null,
            displayName: su.user_metadata?.full_name ?? su.user_metadata?.name ?? null,
            photoURL: su.user_metadata?.avatar_url ?? null,
            user_metadata: su.user_metadata ?? {}
        } as AppUser;
    }

        return () => {
            listener.subscription.unsubscribe();
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
            // Supabase returns session data; extract and map user if present
            clearError();
            const supaUser = (result as any)?.data?.user ?? null;
            return supaUser ? mapSupabaseUser(supaUser) : null;
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
            const result = await authService.registerWithProfile(email, password, displayName);
            resetActivityTimer();
            clearError();
            const supaUser = (result as any)?.data?.user ?? null;
            return supaUser ? mapSupabaseUser(supaUser) : null;
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
            const result = await authService.loginWithGoogle();
            resetActivityTimer();
            clearError();
            const supaUser = (result as any)?.data?.user ?? null;
            return supaUser ? mapSupabaseUser(supaUser) : null;
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
