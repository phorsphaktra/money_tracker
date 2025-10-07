import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionContext';
import { memberService } from '../services/memberService';
import { Member, MemberGroup } from '../types/user';

interface MemberContextType {
  // Current active member (the one being viewed/acted upon)
  activeMember: Member | null;
  // All members in the current group
  members: Member[];
  // Current member group
  memberGroup: MemberGroup | null;
  // Loading states
  isLoading: boolean;
  error: string | null;
  // Actions
  switchToMember: (memberId: string) => Promise<void>;
  switchToOwnProfile: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  updateMemberPermissions: (memberId: string, permissions: Partial<Member['permissions']>) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  // Helper functions
  canPerformAction: (action: keyof Member['permissions']) => boolean;
  isOwner: boolean;
  isCurrentUserActive: boolean;
}

const MemberContext = createContext<MemberContextType | null>(null);

export const MemberProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberGroup, setMemberGroup] = useState<MemberGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeOwnerId } = useTransactions();

  // Get current user's member profile
  const getCurrentUserMember = useCallback((): Member | null => {
    if (!user) return null;
    return members.find(m => m.uid === user.uid) || null;
  }, [members, user]);

  // Check if current user is owner
  const isOwner = useCallback((): boolean => {
    const currentUserMember = getCurrentUserMember();
    return currentUserMember?.role === 'owner' || false;
  }, [getCurrentUserMember]);

  // Check if current user is the active member
  const isCurrentUserActive = useCallback((): boolean => {
    return activeMember?.uid === user?.uid || false;
  }, [activeMember, user]);

  // Load members for the current user's group
  const loadMembers = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use activeOwnerId if set (owner whose data we're viewing), otherwise fallback to current user
      const ownerId = activeOwnerId || user.uid;
      const membersList = await memberService.getMembersInGroup(ownerId);
      
      setMembers(membersList);

      // Restore last selected member for this owner if available
      const storageKey = `activeMemberId:${ownerId}`;
      const storedMemberId = localStorage.getItem(storageKey);

      const currentUserMember = membersList.find(m => m.uid === user.uid) || null;
      const storedMember = storedMemberId ? (membersList.find(m => m.uid === storedMemberId) || null) : null;

      if (storedMember) {
        setActiveMember(storedMember);
      } else if (currentUserMember) {
        setActiveMember(currentUserMember);
      } else if (membersList.length > 0) {
        setActiveMember(membersList[0]);
      }
      
      // Update member's last active time (don't fail if this doesn't work)
      try {
        await memberService.updateMemberLastActive(ownerId, user.uid);
      } catch (updateError) {
        console.warn('Failed to update member last active time:', updateError);
      }
    } catch (err) {
      console.error('Error loading members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
      
      // Create a fallback member for the current user
      const fallbackMember = memberService.createMemberFromUser({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Unknown User',
        photoURL: user.photoURL || null
      }, 'owner');
      
      setMembers([fallbackMember]);
      setActiveMember(fallbackMember);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, activeOwnerId]);

  // Switch to a specific member
  const switchToMember = useCallback(async (memberId: string) => {
    if (!user?.uid) return;

    try {
      const member = members.find(m => m.uid === memberId);
      if (!member) {
        throw new Error('Member not found');
      }

      // Check if current user has permission to view this member
      const currentUserMember = getCurrentUserMember();
      if (!currentUserMember) {
        throw new Error('Current user not found in group');
      }

      // Only allow switching if user is owner or switching to themselves
      if (currentUserMember.role !== 'owner' && memberId !== user.uid) {
        throw new Error('You can only switch to your own profile');
      }

      setActiveMember(member);
      // Persist selection per owner id
      const ownerId = activeOwnerId || user.uid;
      localStorage.setItem(`activeMemberId:${ownerId}`, member.uid);
      
      // Update last active time for the member being switched to
      await memberService.updateMemberLastActive(user.uid, memberId);
    } catch (err) {
      console.error('Error switching to member:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch member');
    }
  }, [members, user?.uid, getCurrentUserMember]);

  // Switch to own profile
  const switchToOwnProfile = useCallback(async () => {
    if (!user?.uid) return;

    const currentUserMember = getCurrentUserMember();
    if (currentUserMember) {
      await switchToMember(user.uid);
    }
  }, [user?.uid, getCurrentUserMember, switchToMember]);

  // Refresh members list
  const refreshMembers = useCallback(async () => {
    setError(null);
    await loadMembers();
  }, [loadMembers]);

  // Update member permissions (owner only)
  const updateMemberPermissions = useCallback(async (memberId: string, permissions: Partial<Member['permissions']>) => {
    if (!user?.uid || !isOwner()) {
      throw new Error('Only the owner can update member permissions');
    }

    try {
      await memberService.updateMemberPermissions(user.uid, memberId, permissions);
      await refreshMembers();
    } catch (err) {
      console.error('Error updating member permissions:', err);
      throw err;
    }
  }, [user?.uid, isOwner, refreshMembers]);

  // Remove member from group (owner only)
  const removeMember = useCallback(async (memberId: string) => {
    if (!user?.uid || !isOwner()) {
      throw new Error('Only the owner can remove members');
    }

    if (memberId === user.uid) {
      throw new Error('Cannot remove yourself from the group');
    }

    try {
      await memberService.removeMemberFromGroup(user.uid, memberId);
      await refreshMembers();
      
      // If the removed member was active, switch to own profile
      if (activeMember?.uid === memberId) {
        await switchToOwnProfile();
      }
    } catch (err) {
      console.error('Error removing member:', err);
      throw err;
    }
  }, [user?.uid, isOwner, refreshMembers, activeMember, switchToOwnProfile]);

  // Check if current user can perform a specific action
  const canPerformAction = useCallback((action: keyof Member['permissions']): boolean => {
    if (!activeMember) return false;
    
    // If viewing own profile, use own permissions
    if (isCurrentUserActive()) {
      const currentUserMember = getCurrentUserMember();
      return currentUserMember?.permissions[action] || false;
    }
    
    // If viewing another member's profile, check if current user is owner
    return isOwner();
  }, [activeMember, isCurrentUserActive, getCurrentUserMember, isOwner]);

  // Load members when user changes
  useEffect(() => {
    if (user?.uid) {
      loadMembers();
    } else {
      setMembers([]);
      setActiveMember(null);
      setMemberGroup(null);
    }
  }, [user?.uid, activeOwnerId, loadMembers]);

  const value: MemberContextType = {
    activeMember,
    members,
    memberGroup,
    isLoading,
    error,
    switchToMember,
    switchToOwnProfile,
    refreshMembers,
    updateMemberPermissions,
    removeMember,
    canPerformAction,
    isOwner: isOwner(),
    isCurrentUserActive: isCurrentUserActive()
  };

  return (
    <MemberContext.Provider value={value}>
      {children}
    </MemberContext.Provider>
  );
};

export const useMember = () => {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error('useMember must be used within a MemberProvider');
  }
  return context;
};
