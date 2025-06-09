import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { UserProfile } from "../types/user";
import { FirebaseError } from "firebase/app";

/**
 * Custom error class for authentication errors
 */
class AuthError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Mapping of Firebase error codes to user-friendly messages
 */
const AUTH_ERROR_MESSAGES = {
  "auth/email-already-in-use":
    "An account already exists with this email address",
  "auth/invalid-email": "Please enter a valid email address",
  "auth/operation-not-allowed":
    "This operation is not allowed. Please contact support",
  "auth/weak-password": "Password should be at least 6 characters long",
  "auth/user-disabled": "This account has been disabled. Please contact support",
  "auth/user-not-found": "No account found with this email address",
  "auth/wrong-password": "Incorrect password. Please try again",
  "auth/too-many-requests": "Too many failed attempts. Please try again later",
  "auth/network-request-failed": "Network error. Please check your connection",
  "permission-denied": "You don't have permission to perform this action",
  "auth/popup-closed-by-user": "Login popup was closed before completion",
  "auth/cancelled-popup-request": "Multiple popup requests were cancelled",
  "auth/popup-blocked": "Login popup was blocked by the browser",
  "auth/requires-recent-login": "Please log in again to complete this action",
  default: "An unexpected error occurred. Please try again",
};

/**
 * Authentication service for handling all Firebase auth operations
 */
export const authService = {
  /**
   * Clear user's FCM token from Firestore
   * Used during logout to ensure push notifications are stopped
   */
  async clearUserToken(uid: string) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      fcmToken: deleteField(),
    });
  },

  // Authentication methods
  /**
   * Register a new user with email and password
   * @throws AuthError if registration fails
   */
  async registerWithEmail(email: string, password: string) {
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },

  /**
   * Login with email and password
   * @throws AuthError if login fails
   */
  async loginWithEmail(email: string, password: string) {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },

  /**
   * Login with Google OAuth
   * Creates user profile if first time login
   * @throws AuthError if Google login fails
   */
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      await this.handleGoogleLogin(user);
      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },

  /**
   * Logout user and clean up
   * - Clears FCM token
   * - Signs out from Firebase
   * @throws AuthError if logout fails
   */
  async logout() {
    try {
      const user = auth.currentUser;
      if (user) {
        await this.clearUserToken(user.uid); // clear token in Firestore
      }
      await signOut(auth); // sign the user out
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },

  /**
   * Register new user with profile creation
   * - Creates Firebase auth account
   * - Updates display name
   * - Creates Firestore profile
   */
  async registerWithProfile(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    try {
      const { user } = await this.registerWithEmail(email, password);
      await updateProfile(user, { displayName });
      await this.createUserProfile({
        uid: user.uid,
        email: user.email!,
        displayName,
        createdAt: new Date(),
        defaultCurrency: "USD",
      });
      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },

  /**
   * Create or update user profile in Firestore
   * Includes default preferences setup
   */
  async createUserProfile(userData: UserProfile) {
    try {
      const userRef = doc(db, "users", userData.uid);
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        preferences: {
          currency: "USD",
          language: "en",
          darkMode: false,
          notifications: true, // Add default notification preference
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Add user timezone
          ...userData.preferences,
        },
        // Add metadata
        metadata: {
          lastUpdated: serverTimestamp(),
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        },
      });
    } catch (error) {
      throw this.handleFirestoreError(error);
    }
  },

  async updateLastLogin(uid: string) {
    try {
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        // If user document doesn't exist, create it with basic info
        const user = auth.currentUser;
        if (user) {
          await this.createUserProfile({
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? 'User',
            createdAt: new Date(),
            defaultCurrency: "USD",
          });
          return;
        }
      }

      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to update last login:', error);
      throw this.handleFirestoreError(error);
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  },

  async updateUserPreferences(
    uid: string,
    preferences: {
      currency?: string;
      language?: string;
      darkMode?: boolean;
    }
  ) {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        preferences: preferences,
      });
    } catch (error) {
      throw this.handleFirestoreError(error);
    }
  },

  /**
   * Helper method to handle Firebase Auth errors
   * Converts Firebase errors to user-friendly messages
   */
  handleAuthError(error: unknown): Error {
    if (error instanceof FirebaseError) {
      console.debug('Auth error:', error.code, error.message); // Add debugging
      const errorMessage =
        AUTH_ERROR_MESSAGES[error.code as keyof typeof AUTH_ERROR_MESSAGES] ||
        AUTH_ERROR_MESSAGES.default;
      return new AuthError(errorMessage, error.code);
    }
    return new AuthError("An unexpected error occurred", "unknown-error");
  },

  /**
   * Helper method to handle Firestore errors
   * Converts Firestore errors to user-friendly messages
   */
  handleFirestoreError(error: unknown): Error {
    if (error instanceof FirebaseError) {
      const errorMessage =
        AUTH_ERROR_MESSAGES[error.code as keyof typeof AUTH_ERROR_MESSAGES] ||
        "Database operation failed. Please try again";
      return new AuthError(errorMessage, error.code);
    }
    return new AuthError("An unexpected error occurred", "unknown-error");
  },

  /**
   * Handle Google login flow
   * Updates existing users or creates new profile
   */
  async handleGoogleLogin(user: User) {
    const userProfile = await this.getUserProfile(user.uid);
    if (userProfile) {
      await this.updateLastLogin(user.uid);
    } else {
      await this.createUserProfile({
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName!,
        photoURL: user.photoURL!,
        createdAt: new Date(),
        defaultCurrency: "USD",
      });
    }
  },
};
