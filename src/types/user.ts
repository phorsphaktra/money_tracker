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
        [x: string]: any;
        darkMode?: boolean;
        currency?: string;
        language?: string;
        invitedMembers?: string[];
        allowMemberEditAllTransactions?: boolean;
    };
    lastLogin?: Date;
}
