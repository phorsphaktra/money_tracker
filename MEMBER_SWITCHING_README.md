# Member Switching System

This document describes the member switching system that allows users to see all members in their range and switch between different member profiles to take actions on behalf of different members.

## Features Implemented

### 1. Member Management System
- **Member Types**: Owner and Member roles with different permissions
- **Member Groups**: Organized groups of members under an owner
- **Permission System**: Granular permissions for different actions
- **Member Switching**: Ability to switch between member profiles

### 2. Member Switcher Component
- **Visual Member Selector**: Dropdown showing all available members
- **Current Member Display**: Shows which member profile is currently active
- **Role Indicators**: Visual indicators for owner vs member roles
- **Quick Switching**: One-click switching between members

### 3. Permission System
- **Granular Permissions**: Fine-grained control over member actions
- **Permission Editor**: UI for owners to edit member permissions
- **Action Validation**: Checks permissions before allowing actions
- **Role-based Access**: Different default permissions for owners vs members

### 4. Member Management UI
- **Member List**: View all members in the group
- **Permission Management**: Edit member permissions (owner only)
- **Member Removal**: Remove members from group (owner only)
- **Status Indicators**: Show member status and last active time

## Files Created/Modified

### New Files
- `src/types/user.ts` - Extended with Member and MemberGroup types
- `src/services/memberService.ts` - Service for member management
- `src/contexts/MemberContext.tsx` - Context for member state management
- `src/components/member/MemberSwitcher.tsx` - Member switching component
- `src/components/member/MemberManagement.tsx` - Member management interface
- `src/components/member/PermissionEditor.tsx` - Permission editing modal
- `MEMBER_SWITCHING_README.md` - This documentation

### Modified Files
- `src/App.tsx` - Added MemberProvider
- `src/components/Navbar.tsx` - Added MemberSwitcher to navbar
- `src/screens/SettingsScreen.tsx` - Added member management section
- `src/services/invitationService.ts` - Auto-add accepted members to groups

## Member Types

### Member Interface
```typescript
interface Member {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
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
  lastActive?: Date;
}
```

### MemberGroup Interface
```typescript
interface MemberGroup {
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  members: Member[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Permission System

### Available Permissions
1. **canViewTransactions** - Can view all transactions in the account
2. **canEditTransactions** - Can create, edit, and modify transactions
3. **canDeleteTransactions** - Can delete transactions permanently
4. **canViewAnalytics** - Can access analytics and reports
5. **canManageMembers** - Can invite and remove team members
6. **canViewSettings** - Can view and modify account settings

### Default Permissions
- **Owner**: All permissions enabled
- **Member**: View transactions and analytics enabled, others based on owner settings

## Usage

### 1. Member Switching
```typescript
// In any component
const { activeMember, switchToMember, switchToOwnProfile } = useMember();

// Switch to a specific member
await switchToMember(memberId);

// Switch back to own profile
await switchToOwnProfile();
```

### 2. Permission Checking
```typescript
// Check if current user can perform an action
const { canPerformAction } = useMember();

if (canPerformAction('canEditTransactions')) {
  // Allow editing transactions
}
```

### 3. Member Management (Owner Only)
```typescript
// Update member permissions
const { updateMemberPermissions } = useMember();
await updateMemberPermissions(memberId, {
  canEditTransactions: true,
  canDeleteTransactions: false
});

// Remove member from group
const { removeMember } = useMember();
await removeMember(memberId);
```

## UI Components

### MemberSwitcher
- **Location**: Top navigation bar
- **Function**: Shows current active member and allows switching
- **Features**: 
  - Dropdown with all available members
  - Visual role indicators (owner/member)
  - Current member highlighting
  - Loading states during switching

### MemberManagement
- **Location**: Settings screen (owner only)
- **Function**: Manage team members and permissions
- **Features**:
  - List all members with status
  - Edit member permissions
  - Remove members from group
  - View member activity

### PermissionEditor
- **Location**: Modal overlay
- **Function**: Edit individual member permissions
- **Features**:
  - Toggle permissions on/off
  - Permission descriptions
  - Save/cancel actions
  - Loading states

## Data Flow

### Member Group Creation
1. When user creates account → Creates member group with owner
2. When invitation accepted → Adds member to group
3. Member permissions set based on owner preferences

### Member Switching
1. User selects member from switcher
2. Context updates activeMember state
3. All components re-render with new member context
4. Permission checks use active member's permissions

### Permission Updates
1. Owner edits member permissions
2. Updates stored in Firestore
3. Member context refreshes
4. UI updates to reflect new permissions

## Firestore Structure

### memberGroups Collection
```javascript
// Document ID: ownerId
{
  ownerId: "owner-uid",
  ownerEmail: "owner@example.com",
  ownerName: "Owner Name",
  members: [
    {
      uid: "member-uid",
      email: "member@example.com",
      displayName: "Member Name",
      role: "member",
      permissions: { ... },
      joinedAt: "2024-01-01T00:00:00Z",
      isActive: true,
      lastActive: "2024-01-01T00:00:00Z"
    }
  ],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

## Security Considerations

### Permission Validation
- All actions check permissions before execution
- Server-side validation recommended for production
- Owner-only actions protected in UI

### Data Access
- Members can only access their group's data
- Permission checks at component level
- Firestore rules should enforce access control

### Member Management
- Only owners can manage members
- Cannot remove self from group
- Cannot edit own permissions (except through settings)

## Integration with Existing Features

### Invitation System
- Accepted invitations automatically add members to groups
- Member permissions set based on owner preferences
- Push notifications for member actions

### Transaction System
- Transactions filtered by active member
- Permission checks before allowing edits
- Owner can view/edit all member transactions

### Analytics
- Analytics data filtered by active member
- Permission-based access to different reports
- Owner sees aggregated data from all members

## Testing

### Manual Testing
1. **Member Switching**: Test switching between different members
2. **Permission Checks**: Verify actions are blocked based on permissions
3. **Owner Actions**: Test member management features
4. **UI Updates**: Ensure UI reflects current active member

### Test Scenarios
1. Owner invites member → Member accepts → Member appears in group
2. Owner edits member permissions → Changes take effect immediately
3. Member switches to another member → UI updates accordingly
4. Member without edit permission → Cannot edit transactions

## Future Enhancements

### Potential Features
1. **Member Activity Logs**: Track member actions and changes
2. **Bulk Permission Updates**: Update multiple members at once
3. **Member Groups**: Organize members into sub-groups
4. **Advanced Permissions**: More granular permission controls
5. **Member Analytics**: Individual member performance metrics

### Technical Improvements
1. **Real-time Updates**: Live updates when permissions change
2. **Offline Support**: Cache member data for offline use
3. **Performance Optimization**: Lazy load member data
4. **Audit Trail**: Log all permission changes and member actions
