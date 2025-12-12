import { supabase } from '../config/supabase';
import type { User } from '@supabase/supabase-js';
import { UserProfile } from '../types/user';

class AuthError extends Error {
  code: string;
  constructor(message: string, code = 'unknown') {
    super(message);
    this.code = code;
  }
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'An account already exists with this email address', // unique_violation
  'invalid-email': 'Please enter a valid email address',
  'invalid-password': 'Password should be at least 6 characters long',
  default: 'An unexpected error occurred. Please try again',
};

export const authService = {
  async clearUserToken(uid: string) {
    await supabase.from('users').update({ fcm_token: null }).eq('uid', uid);
  },

  async registerWithEmail(email: string, password: string) {
    const res = await supabase.auth.signUp({ email, password });
    if (res.error) throw this.handleAuthError(res.error);
    return res;
  },

  async loginWithEmail(email: string, password: string) {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) throw this.handleAuthError(res.error);
    return res;
  },

  async loginWithGoogle() {
    // Trigger OAuth redirect flow. The client will be redirected back to the app.
    const res = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (res.error) throw this.handleAuthError(res.error);
    return res;
  },

  async logout() {
    const currentUser = supabase.auth.getUser();
    if (currentUser) {
      const { data } = await currentUser;
      if (data?.user?.id) {
        await this.clearUserToken(data.user.id);
      }
    }
    const res = await supabase.auth.signOut();
    if (res.error) throw this.handleAuthError(res.error);
  },

  async registerWithProfile(email: string, password: string, displayName: string) {
    const result = await this.registerWithEmail(email, password);
    // If confirmation required, user may be null until they confirm; still create profile when user exists
    const user = result.data?.user as User | null | undefined;
    if (user) {
      await this.createUserProfile({
        uid: user.id,
        email: user.email || email,
        displayName,
        createdAt: new Date(),
        defaultCurrency: 'USD',
      });
    }
    return result;
  },

  async createUserProfile(userData: UserProfile) {
    try {
      const payload = {
        uid: userData.uid,
        email: userData.email,
        display_name: userData.displayName,
        photo_url: userData.photoURL || null,
        created_at: new Date().toISOString(),
        default_currency: userData.defaultCurrency || 'USD',
        preferences: userData.preferences || {},
        last_login: userData.lastLogin ? userData.lastLogin.toISOString() : new Date().toISOString(),
        metadata: {
          platform: typeof navigator !== 'undefined' ? navigator.platform : null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        },
      };
  const { error } = await supabase.from('users').upsert([payload], { onConflict: 'uid' });
      if (error) throw error;
    } catch (error) {
      throw this.handleFirestoreError(error as any);
    }
  },

  async updateLastLogin(uid: string) {
    try {
      const { data, error } = await supabase.from('users').select('uid').eq('uid', uid).limit(1).maybeSingle();
      if (error) throw error;
      if (!data) {
        // Create minimal profile
        await this.createUserProfile({
          uid,
          email: '',
          displayName: 'User',
          createdAt: new Date(),
          defaultCurrency: 'USD',
        });
        return;
      }
      const { error: upErr } = await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('uid', uid);
      if (upErr) throw upErr;
    } catch (error) {
      console.error('Failed to update last login:', error);
      throw this.handleFirestoreError(error as any);
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from('users').select('*').eq('uid', uid).limit(1).maybeSingle();
    if (error) throw this.handleFirestoreError(error as any);
    if (!data) return null;
    const profile: UserProfile = {
      uid: data.uid,
      email: data.email,
      displayName: data.display_name,
      photoURL: data.photo_url,
      createdAt: new Date(data.created_at),
      defaultCurrency: data.default_currency || 'USD',
      preferences: data.preferences || {},
      lastLogin: data.last_login ? new Date(data.last_login) : undefined,
    };
    return profile;
  },

  async updateUserPreferences(uid: string, preferences: Record<string, any>) {
    try {
      const { error } = await supabase.from('users').update({ preferences }).eq('uid', uid);
      if (error) throw error;
    } catch (error) {
      throw this.handleFirestoreError(error as any);
    }
  },

  handleAuthError(error: any): Error {
    const msg = (error?.message) || AUTH_ERROR_MESSAGES.default;
    const code = error?.status || error?.code || 'unknown-error';
    return new AuthError(msg, String(code));
  },

  handleFirestoreError(error: any): Error {
    const msg = (error?.message) || 'Database operation failed. Please try again';
    const code = error?.code || 'db-error';
    return new AuthError(msg, String(code));
  },

  async handleGoogleLogin(user: User | null) {
    if (!user) return;
    const uid = user.id;
    const profile = await this.getUserProfile(uid);
    if (profile) {
      await this.updateLastLogin(uid);
    } else {
      await this.createUserProfile({
        uid,
        email: user.email || '',
        displayName: (user.user_metadata as any)?.full_name || (user.email || 'User'),
        photoURL: (user.user_metadata as any)?.avatar_url || '',
        createdAt: new Date(),
        defaultCurrency: 'USD',
      });
    }
  },
};
