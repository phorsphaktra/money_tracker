import { useState, useEffect } from 'react';
import { Member } from '../../types/user';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface PermissionEditorProps {
  member: Member;
  onSave: (memberId: string, permissions: Partial<Member['permissions']>) => Promise<void>;
  onCancel: () => void;
  isUpdating?: boolean;
}

export const PermissionEditor = ({ 
  member, 
  onSave, 
  onCancel, 
  isUpdating = false 
}: PermissionEditorProps) => {
  const [permissions, setPermissions] = useState<Member['permissions']>(member.permissions);

  useEffect(() => {
    setPermissions(member.permissions);
  }, [member.permissions]);

  const handlePermissionChange = (key: keyof Member['permissions'], value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    await onSave(member.uid, permissions);
  };

  const permissionLabels: Record<keyof Member['permissions'], string> = {
    canViewTransactions: 'View Transactions',
    canEditTransactions: 'Edit Transactions',
    canDeleteTransactions: 'Delete Transactions',
    canViewAnalytics: 'View Analytics',
    canManageMembers: 'Manage Members',
    canViewSettings: 'View Settings'
  };

  const permissionDescriptions: Record<keyof Member['permissions'], string> = {
    canViewTransactions: 'Can view all transactions in the account',
    canEditTransactions: 'Can create, edit, and modify transactions',
    canDeleteTransactions: 'Can delete transactions permanently',
    canViewAnalytics: 'Can access analytics and reports',
    canManageMembers: 'Can invite and remove team members',
    canViewSettings: 'Can view and modify account settings'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Permissions
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Editing permissions for:
            </div>
            <div className="font-medium text-gray-900 dark:text-white">
              {member.displayName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {member.email}
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(permissionLabels).map(([key, label]) => {
              const permissionKey = key as keyof Member['permissions'];
              const isEnabled = permissions[permissionKey];
              
              return (
                <div key={key} className="flex items-start gap-3">
                  <button
                    onClick={() => handlePermissionChange(permissionKey, !isEnabled)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isEnabled
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500'
                    }`}
                  >
                    {isEnabled && <CheckIcon className="w-3 h-3" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {permissionDescriptions[permissionKey]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <LoadingSpinner size="small" className="text-white" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            
            <button
              onClick={onCancel}
              disabled={isUpdating}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
