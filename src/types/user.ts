export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    createdAt: Date;
    defaultCurrency: string;
    phoneNumber?: string;
    country?: string;
    timezone?: string;
    preferences?: {
        darkMode?: boolean;
        currency?: string;
        language?: string;
    };
    lastLogin?: Date;
}
