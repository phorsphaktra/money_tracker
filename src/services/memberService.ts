import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  updateDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { Member, MemberGroup } from '../types/user';

const MEMBERS_COLLECTION = 'memberGroups';
const USERS_COLLECTION = 'users';

export const memberService = {
  /**
   * Get all members in a group (including owner)
   */
  async getMembersInGroup(ownerId: string): Promise<Member[]> {
    try {
      // Get the member group document
      const groupRef = doc(db, MEMBERS_COLLECTION, ownerId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        // If no group exists, create one with just the owner
        const owner = await this.getUserProfile(ownerId);
        if (owner) {
          // Ensure the owner profile has required fields
          const ownerProfile = {
            ...owner,
            uid: ownerId,
            email: owner.email || '',
            displayName: owner.displayName || 'Unknown User',
            photoURL: (owner as any).photoURL || null
          };
          
          await this.createMemberGroup(ownerId, ownerProfile);
          return [this.createMemberFromUser(ownerProfile, 'owner')];
        }
        return [];
      }
      
      const groupData = groupSnap.data() as MemberGroup;
      return (groupData.members || []).map(m => ({
        ...m,
        // normalize pending label casing and ensure non-undefined optional fields
        photoURL: m.photoURL ?? null,
        lastActive: m.lastActive ?? null,
      }));
    } catch (error) {
      console.error('Error getting members in group:', error);
      throw error;
    }
  },

  /**
   * Add a pending (stub) member profile to a group using invitee email
   * This enables owners to switch to a member profile even before the invitee accepts.
   */
  async addPendingMemberByEmail(ownerId: string, inviteeEmail: string, displayName?: string): Promise<void> {
    try {
      const groupRef = doc(db, MEMBERS_COLLECTION, ownerId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        // Create the group with owner first
        const owner = await this.getUserProfile(ownerId);
        if (!owner) return;
        await this.createMemberGroup(ownerId, {
          uid: ownerId,
          email: owner.email || '',
          displayName: owner.displayName || 'Unknown User',
          photoURL: (owner as any).photoURL || null
        });
      }

      const existingGroupSnap = await getDoc(groupRef);
      const groupData = existingGroupSnap.data() as MemberGroup;

      // Use a stable synthetic id for pending member tied to email
      const pendingId = `pending:${inviteeEmail.toLowerCase()}`;
      const already = (groupData.members || []).some(m => m.uid === pendingId) || (groupData.memberIds || []).includes(pendingId);
      if (already) return;

      const stubMember: Member = {
        uid: pendingId,
        email: inviteeEmail.toLowerCase(),
        displayName: displayName || inviteeEmail,
        photoURL: null,
        role: 'member',
        permissions: {
          canViewTransactions: false,
          canEditTransactions: false,
          canDeleteTransactions: false,
          canViewAnalytics: false,
          canManageMembers: false,
          canViewSettings: false
        },
        joinedAt: new Date(),
        isActive: true,
        lastActive: new Date()
      };

      const nextMembers = [...(groupData.members || []), stubMember];
      const nextMemberIds = Array.from(new Set([...(groupData.memberIds || []), stubMember.uid]));

      await updateDoc(groupRef, {
        members: nextMembers,
        memberIds: nextMemberIds,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding pending member by email:', error);
    }
  },

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      
      // If user profile doesn't exist, create a basic one
      console.warn(`User profile not found for ${userId}, creating basic profile`);
      const basicProfile = {
        uid: userId,
        email: '', // Will be filled from auth
        displayName: 'Unknown User',
        createdAt: new Date(),
        defaultCurrency: 'USD',
        preferences: {
          darkMode: false,
          currency: 'USD',
          language: 'en',
          invitedMembers: [],
          allowMemberEditAllTransactions: false
        }
      };
      
      // Try to create the profile
      try {
        await setDoc(userRef, basicProfile);
        return basicProfile;
      } catch (createError) {
        console.error('Failed to create user profile:', createError);
        return basicProfile; // Return the basic profile anyway
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  /**
   * Create a member group for an owner
   */
  async createMemberGroup(ownerId: string, ownerProfile: any): Promise<void> {
    try {
      const groupRef = doc(db, MEMBERS_COLLECTION, ownerId);
      const ownerMember = this.createMemberFromUser(ownerProfile, 'owner');
      
      const memberGroup: MemberGroup = {
        ownerId,
        ownerEmail: ownerProfile.email || '',
        ownerName: ownerProfile.displayName || 'Unknown User',
        members: [ownerMember],
        memberIds: [ownerMember.uid],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(groupRef, memberGroup);
    } catch (error) {
      console.error('Error creating member group:', error);
      throw error;
    }
  },

  /**
   * Add a member to a group
   */
  async addMemberToGroup(ownerId: string, memberProfile: any, permissions?: Partial<Member['permissions']>): Promise<void> {
    try {
      const groupRef = doc(db, MEMBERS_COLLECTION, ownerId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        throw new Error('Member group not found');
      }
      
      const groupData = groupSnap.data() as MemberGroup;
      const newMember = this.createMemberFromUser(memberProfile, 'member', permissions);
      
      // Check if member already exists
      const existingMemberIndex = groupData.members.findIndex(m => m.uid === memberProfile.uid);
      
      if (existingMemberIndex >= 0) {
        // Update existing member
        groupData.members[existingMemberIndex] = newMember;
      } else {
        // Add new member
        groupData.members.push(newMember);
        groupData.memberIds = Array.from(new Set([...(groupData.memberIds || []), newMember.uid]));
      }
      
      await updateDoc(groupRef, {
        members: groupData.members,
        memberIds: groupData.memberIds || groupData.members.map(m => m.uid),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding member to group:', error);
      throw error;
    }
  },

  /**
   * Remove a member from a group
   */
  async removeMemberFromGroup(ownerId: string, memberId: string): Promise<void> {
    try {
      const groupRef = doc(db, MEMBERS_COLLECTION, ownerId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        throw new Error('Member group not found');
      }
      
      const groupData = groupSnap.data() as MemberGroup;
      const updatedMembers = groupData.members.filter(m => m.uid !== memberId);
      const updatedMemberIds = (groupData.memberIds || groupData.members.map(m => m.uid)).filter(id => id !== memberId);
      
      await updateDoc(groupRef, {
        members: updatedMembers,
        memberIds: updatedMemberIds,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing member from group:', error);
      throw error;
    }
  },

  /**
   * Update member permissions
   */
  async updateMemberPermissions(ownerId: string, memberId: string, permissions: Partial<Member['permissions']>): Promise<void> {
    try {
      const groupRef = doc(db, MEMBERS_COLLECTION, ownerId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        throw new Error('Member group not found');
      }
      
      const groupData = groupSnap.data() as MemberGroup;
      const memberIndex = groupData.members.findIndex(m => m.uid === memberId);
      
      if (memberIndex === -1) {
        throw new Error('Member not found');
      }
      
      // Update member permissions
      groupData.members[memberIndex] = {
        ...groupData.members[memberIndex],
        permissions: {
          ...groupData.members[memberIndex].permissions,
          ...permissions
        }
      };
      
      await updateDoc(groupRef, {
        members: groupData.members,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating member permissions:', error);
      throw error;
    }
  },

  /**
   * Get member by ID from a group
   */
  async getMemberFromGroup(ownerId: string, memberId: string): Promise<Member | null> {
    try {
      const members = await this.getMembersInGroup(ownerId);
      return members.find(m => m.uid === memberId) || null;
    } catch (error) {
      console.error('Error getting member from group:', error);
      throw error;
    }
  },

  /**
   * Update member's last active time
   */
  async updateMemberLastActive(ownerId: string, memberId: string): Promise<void> {
    try {
      const groupRef = doc(db, MEMBERS_COLLECTION, ownerId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        return;
      }
      
      const groupData = groupSnap.data() as MemberGroup;
      const memberIndex = groupData.members.findIndex(m => m.uid === memberId);
      
      if (memberIndex === -1) {
        return;
      }
      
      groupData.members[memberIndex] = {
        ...groupData.members[memberIndex],
        lastActive: new Date()
      };
      
      await updateDoc(groupRef, {
        members: groupData.members,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating member last active:', error);
      // Don't throw error for this non-critical operation
    }
  },

  /**
   * Create a Member object from UserProfile
   */
  createMemberFromUser(userProfile: any, role: 'owner' | 'member', customPermissions?: Partial<Member['permissions']>): Member {
    const defaultPermissions: Member['permissions'] = {
      canViewTransactions: true,
      canEditTransactions: role === 'owner' || userProfile.preferences?.allowMemberEditAllTransactions,
      canDeleteTransactions: role === 'owner',
      canViewAnalytics: true,
      canManageMembers: role === 'owner',
      canViewSettings: role === 'owner'
    };

    return {
      uid: userProfile.uid || '',
      email: userProfile.email || '',
      displayName: userProfile.displayName || 'Unknown User',
      photoURL: userProfile.photoURL || null,
      role,
      permissions: customPermissions ? { ...defaultPermissions, ...customPermissions } : defaultPermissions,
      joinedAt: new Date(),
      isActive: true,
      lastActive: new Date()
    };
  },

  /**
   * Get all groups where a user is a member
   */
  async getGroupsForUser(userId: string): Promise<MemberGroup[]> {
    try {
      const groupsQuery = query(
        collection(db, MEMBERS_COLLECTION),
        where('members', 'array-contains-any', [{ uid: userId }])
      );
      
      const groupsSnap = await getDocs(groupsQuery);
      return groupsSnap.docs.map(doc => doc.data() as MemberGroup);
    } catch (error) {
      console.error('Error getting groups for user:', error);
      throw error;
    }
  }
};
