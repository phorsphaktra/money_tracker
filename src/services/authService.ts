import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    User,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile } from '../types/user';
import { FirebaseError } from 'firebase/app';

class AuthError extends Error {
    code: string;
    constructor(message: string, code: string) {
        super(message);
        this.code = code;
    }
}

export const authService = {
    // Authentication methods
    async registerWithEmail(email: string, password: string) {
        try {
            return await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            throw this.handleAuthError(error);
        }
    },

    async loginWithEmail(email: string, password: string) {
        try {
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            throw this.handleAuthError(error);
        }
    },

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

    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            throw this.handleAuthError(error);
        }
    },

    // Profile management methods
    async registerWithProfile(email: string, password: string, displayName: string): Promise<User> {
        try {
            const { user } = await this.registerWithEmail(email, password);
            await updateProfile(user, { displayName });
            await this.createUserProfile({
                uid: user.uid,
                email: user.email!,
                displayName,
                createdAt: new Date(),
                defaultCurrency: 'USD'
            });
            return user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    },

    // User profile methods
    async createUserProfile(userData: UserProfile) {
        try {
            const userRef = doc(db, 'users', userData.uid);
            await setDoc(userRef, {
                ...userData,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                preferences: {
                    currency: 'USD',
                    language: 'en',
                    darkMode: false,
                    ...userData.preferences
                }
            });
        } catch (error) {
            throw this.handleFirestoreError(error);
        }
    },

    async updateLastLogin(uid: string) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            lastLogin: serverTimestamp()
        });
    },

    async getUserProfile(uid: string): Promise<UserProfile | null> {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);
        return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    },

    // Helper methods
    handleAuthError(error: unknown): Error {
        if (error instanceof FirebaseError) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    return new AuthError('Email already exists', error.code);
                case 'auth/invalid-email':
                    return new AuthError('Invalid email address', error.code);
                case 'auth/operation-not-allowed':
                    return new AuthError('Operation not allowed', error.code);
                case 'auth/weak-password':
                    return new AuthError('Password is too weak', error.code);
                default:
                    return new AuthError(error.message, error.code);
            }
        }
        return error as Error;
    },

    handleFirestoreError(error: unknown): Error {
        if (error instanceof FirebaseError) {
            if (error.code === 'permission-denied') {
                return new AuthError('Permission denied: Please check Firebase security rules', error.code);
            }
        }
        return error as Error;
    },

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
                defaultCurrency: 'USD'
            });
        }
    }
};
