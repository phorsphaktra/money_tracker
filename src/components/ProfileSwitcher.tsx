import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useSaving } from '../contexts/SavingContext';
import { invitationService } from '../services/invitationService';
import { authService } from '../services/authService';
import { LoadingSpinner } from './shared/LoadingSpinner';
import { ChevronDownIcon, UserIcon, UserGroupIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Profile {
  id: string;
  name: string;
  email: string;
  type: 'personal' | 'group';
}

export const ProfileSwitcher = () => {
  const { user } = useAuth();
  const { activeOwnerId: txActiveOwnerId, switchActiveOwner: switchTxOwner } = useTransactions();
  const { switchActiveOwner: switchSavingOwner } = useSaving();
  const [isOpen, setIsOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  // Use transaction context activeOwnerId as source of truth, fallback to user.uid
  const activeOwnerId = txActiveOwnerId || user?.uid || null;

  const loadProfiles = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allProfiles: Profile[] = [];

      // Add personal profile
      allProfiles.push({
        id: user.uid,
        name: user.displayName || user.email || 'Personal',
        email: user.email || '',
        type: 'personal',
      });

      // Load accepted invitations (groups)
      const acceptedInvites = await invitationService.getAcceptedInvitationsForEmail(user.email);
      
      // Get unique owner IDs and fetch their profiles
      const uniqueOwnerIds = [...new Set(acceptedInvites.map(inv => inv.ownerId))];
      const ownerProfiles = await Promise.all(
        uniqueOwnerIds.map(async (ownerId) => {
          try {
            const profile = await authService.getUserProfile(ownerId);
            if (profile) {
              return {
                id: ownerId,
                name: profile.displayName || profile.email || 'Unknown',
                email: profile.email || '',
                type: 'group' as const,
              };
            }
            // Fallback to invitation data if profile not found
            const invite = acceptedInvites.find(inv => inv.ownerId === ownerId);
            return {
              id: ownerId,
              name: invite?.ownerName || invite?.ownerEmail || 'Unknown Group',
              email: invite?.ownerEmail || '',
              type: 'group' as const,
            };
          } catch (e) {
            console.error('Failed to load profile for owner:', ownerId, e);
            const invite = acceptedInvites.find(inv => inv.ownerId === ownerId);
            return {
              id: ownerId,
              name: invite?.ownerName || invite?.ownerEmail || 'Unknown Group',
              email: invite?.ownerEmail || '',
              type: 'group' as const,
            };
          }
        })
      );

      allProfiles.push(...ownerProfiles);
      setProfiles(allProfiles);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles, user?.email]);

  // Reload profiles when activeOwnerId changes (e.g., after accepting an invitation)
  // This ensures the new group appears in the list
  useEffect(() => {
    if (activeOwnerId && !loading && !profiles.find(p => p.id === activeOwnerId)) {
      loadProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOwnerId]); // Only depend on activeOwnerId to avoid unnecessary reloads when profiles changes

  const handleSwitchProfile = async (ownerId: string) => {
    if (ownerId === activeOwnerId) {
      setIsOpen(false);
      return;
    }

    setSwitching(ownerId);
    try {
      // Switch in both contexts simultaneously
      await Promise.all([
        switchTxOwner(ownerId),
        switchSavingOwner(ownerId),
      ]);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to switch profile:', err);
    } finally {
      setSwitching(null);
    }
  };

  const activeProfile = profiles.find(p => p.id === activeOwnerId);

  if (!user || loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
        <LoadingSpinner size="small" />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[40px] touch-manipulation"
        aria-label="Switch profile"
        aria-expanded={isOpen}
      >
        {activeProfile?.type === 'group' ? (
          <UserGroupIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px] sm:max-w-[200px]">
          {activeProfile?.name || 'Personal'}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-[400px] overflow-auto">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Switch Profile
              </div>
              {profiles.map((profile) => {
                const isActive = profile.id === activeOwnerId;
                const isSwitching = switching === profile.id;

                return (
                  <button
                    key={profile.id}
                    onClick={() => handleSwitchProfile(profile.id)}
                    disabled={isSwitching || isActive}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors touch-manipulation ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    } ${isSwitching ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {isSwitching ? (
                      <LoadingSpinner size="small" className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                    ) : profile.type === 'group' ? (
                      <UserGroupIcon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                    ) : (
                      <UserIcon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{profile.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.email}</div>
                    </div>
                    {isActive && (
                      <CheckIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

