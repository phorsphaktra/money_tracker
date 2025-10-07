import { useState, useCallback } from 'react';
import { useMember } from '../../contexts/MemberContext';
import { useAuth } from '../../contexts/AuthContext';
import { Member } from '../../types/user';
import { 
  UserIcon, 
  TrashIcon, 
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmDialog } from '../ConfirmDialog';

interface MemberManagementProps {
  className?: string;
  onEditMember?: (member: Member) => void;
}

export const MemberManagement = ({ className = '', onEditMember }: MemberManagementProps) => {
  const { 
    members, 
    isLoading, 
    error, 
    removeMember,
    isOwner 
  } = useMember();
  const { user } = useAuth();
  
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleEditPermissions = useCallback((member: Member) => {
    if (onEditMember) {
      onEditMember(member);
    }
  }, [onEditMember]);

  const handleRemoveMember = useCallback((member: Member) => {
    setMemberToRemove(member);
    setShowRemoveConfirm(true);
  }, []);

  const confirmRemoveMember = useCallback(async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      await removeMember(memberToRemove.uid);
      setShowRemoveConfirm(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setIsRemoving(false);
    }
  }, [memberToRemove, removeMember]);

  // Custom Crown Icon Component
  const CrownIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 16L3 8l5.5 5L12 4l3.5 9L21 8l-2 8H5zm2.7-2h8.6l.9-4.4L14 12l-2-5.5L10 12l-3.2-2.4L7.7 14z"/>
    </svg>
  );

  const getMemberRoleIcon = (member: Member) => {
    if (member.role === 'owner') {
      return <CrownIcon className="w-5 h-5 text-yellow-500" />;
    }
    return <UserIcon className="w-5 h-5 text-gray-500" />;
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

  if (!isOwner) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg ${className}`}>
        <div className="text-red-700 dark:text-red-400 text-sm">
          Error loading members: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Team Members
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.uid}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getMemberRoleIcon(member)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.displayName}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getMemberStatusColor(member)}`}>
                      {member.role}
                    </span>
                    {member.uid === user?.uid && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {member.email}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {member.role !== 'owner' && member.uid !== user?.uid && (
                  <>
                    <button
                      onClick={() => handleEditPermissions(member)}
                      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Edit permissions"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Remove member"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Permissions Display */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Permissions
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(member.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    {value ? (
                      <CheckIcon className="w-3 h-3 text-green-500" />
                    ) : (
                      <XMarkIcon className="w-3 h-3 text-red-500" />
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemoveConfirm}
        onClose={() => {
          setShowRemoveConfirm(false);
          setMemberToRemove(null);
        }}
        onConfirm={confirmRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.displayName} from the team? This action cannot be undone.`}
        confirmLabel="Remove"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        loading={isRemoving}
      />
    </div>
  );
};
