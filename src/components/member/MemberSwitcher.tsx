import { useState, useRef, useEffect } from 'react';
import { useMember } from '../../contexts/MemberContext';
import { useAuth } from '../../contexts/AuthContext';
import { Member } from '../../types/user';
import { ChevronDownIcon, UserIcon, CheckIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface MemberSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export const MemberSwitcher = ({ className = '', showLabel = true }: MemberSwitcherProps) => {
  const { 
    activeMember, 
    members, 
    isLoading, 
    error, 
    switchToMember, 
    switchToOwnProfile,
    isCurrentUserActive,
    refreshMembers
  } = useMember();
  const { user } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMemberSwitch = async (memberId: string) => {
    if (memberId === activeMember?.uid) {
      setIsOpen(false);
      return;
    }

    setSwitchingTo(memberId);
    try {
      await switchToMember(memberId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch member:', error);
    } finally {
      setSwitchingTo(null);
    }
  };

  const handleOwnProfileSwitch = async () => {
    setSwitchingTo(user?.uid || '');
    try {
      await switchToOwnProfile();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch to own profile:', error);
    } finally {
      setSwitchingTo(null);
    }
  };

  const getMemberDisplayName = (member: Member) => {
    if (member.uid === user?.uid) {
      return `${member.displayName} (You)`;
    }
    return member.displayName;
  };

  // Custom Crown Icon Component
  const CrownIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 16L3 8l5.5 5L12 4l3.5 9L21 8l-2 8H5zm2.7-2h8.6l.9-4.4L14 12l-2-5.5L10 12l-3.2-2.4L7.7 14z"/>
    </svg>
  );

  const getMemberRoleIcon = (member: Member) => {
    if (member.role === 'owner') {
      return <CrownIcon className="w-4 h-4 text-yellow-500" />;
    }
    return <UserIcon className="w-4 h-4 text-gray-500" />;
  };

  const getMemberStatusColor = (member: Member) => {
    if (member.uid === user?.uid) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    if (member.role === 'owner') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <LoadingSpinner size="small" />
        <span className="text-sm text-gray-500">Loading members...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-red-500">Error loading members</span>
        <button
          onClick={refreshMembers}
          className="text-xs text-blue-500 hover:text-blue-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // If no active member but we have a user, show a basic display
  if (!activeMember && user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <UserIcon className="w-4 h-4 text-gray-500" />
        <div className="text-left min-w-0">
          {showLabel && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Your Profile
            </div>
          )}
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.displayName || user.email || 'Unknown User'}
          </div>
        </div>
      </div>
    );
  }

  if (!activeMember || members.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation"
        disabled={switchingTo !== null}
      >
        <div className="flex items-center gap-2 min-w-0">
          {getMemberRoleIcon(activeMember)}
          <div className="text-left min-w-0">
            {showLabel && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isCurrentUserActive ? 'Your Profile' : 'Viewing'}
              </div>
            )}
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {getMemberDisplayName(activeMember)}
            </div>
          </div>
        </div>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
              Switch Profile
            </div>
            <div className="px-2 pb-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            {/* Own Profile Option */}
            <button
              onClick={handleOwnProfileSwitch}
              disabled={switchingTo === user?.uid}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors ${
                isCurrentUserActive 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {switchingTo === user?.uid ? (
                <LoadingSpinner size="small" />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {user?.displayName || user?.email} (You)
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Your own profile
                </div>
              </div>
              {isCurrentUserActive && (
                <CheckIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              )}
            </button>

            {/* Other Members */}
            {members
              .filter(member => {
                const q = query.trim().toLowerCase();
                if (!q) return true;
                return (
                  member.displayName.toLowerCase().includes(q) ||
                  member.email.toLowerCase().includes(q)
                );
              })
              .filter(member => member.uid !== user?.uid)
              .map((member) => (
                <button
                  key={member.uid}
                  onClick={() => handleMemberSwitch(member.uid)}
                  disabled={switchingTo === member.uid}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors ${
                    activeMember.uid === member.uid 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {switchingTo === member.uid ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    getMemberRoleIcon(member)
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {member.displayName}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${getMemberStatusColor(member)}`}>
                        {member.uid.startsWith('pending:') ? 'pending' : member.role}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {member.email}
                    </div>
                  </div>
                  {activeMember.uid === member.uid && (
                    <CheckIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
              ))}

            {members.filter(member => member.uid !== user?.uid).length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No other members in this group
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
