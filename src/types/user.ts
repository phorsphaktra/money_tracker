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

export interface Member {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    role: 'owner' | 'member';
    permissions: {
        canViewTransactions: boolean;
        canEditTransactions: boolean;
        canDeleteTransactions: boolean;
        canViewAnalytics: boolean;
        canManageMembers: boolean;
        canViewSettings: boolean;
    };
    joinedAt: Date;
    isActive: boolean;
    lastActive: Date | null;
}

export interface MemberGroup {
    ownerId: string;
    ownerEmail: string;
    ownerName: string;
    members: Member[];
    memberIds: string[];
    createdAt: Date;
    updatedAt: Date;
}
