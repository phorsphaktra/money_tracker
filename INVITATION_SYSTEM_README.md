# Invitation System with Push Notifications

This document describes the enhanced invitation system implementation with push notifications and proper data cleanup.

## Features Implemented

### 1. Push Notifications
- **Firebase Cloud Messaging (FCM)** integration for real-time notifications
- **Service Worker** for background notification handling
- **Foreground and background** message handling
- **Notification permission** management

### 2. Enhanced Invitation System
- **Send push notifications** to invitees when invited
- **Notify owners** when invitations are accepted/rejected
- **Uninvite functionality** for inviters to cancel invitations
- **Automatic data cleanup** when invitations are rejected

### 3. Data Management
- **Proper cleanup** of invitation data when rejected
- **Automatic removal** from owner's invited members list
- **Delayed deletion** of rejected invitations (24 hours)
- **Error handling** and fallback mechanisms

## Files Modified/Created

### New Files
- `src/services/notificationService.ts` - Push notification service
- `src/components/notification/NotificationHandler.tsx` - Notification handler component
- `public/firebase-messaging-sw.js` - Service worker for background notifications
- `INVITATION_SYSTEM_README.md` - This documentation

### Modified Files
- `src/config/firebase.ts` - Added FCM configuration
- `src/services/invitationService.ts` - Enhanced with push notifications and uninvite
- `src/contexts/NotificationContext.tsx` - Added push notification support
- `src/screens/SettingsScreen.tsx` - Added uninvite UI and push notification settings
- `src/App.tsx` - Added NotificationHandler wrapper
- `src/main.tsx` - Added service worker registration

## Environment Variables Required

Add these to your `.env` file:

```env
# Firebase VAPID Key for push notifications
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here

# Webhook URL for sending push notifications (backend service)
VITE_NOTIFICATION_WEBHOOK_URL=https://your-backend.com/api/notifications

# Existing webhook for email notifications
VITE_INVITE_WEBHOOK_URL=https://your-backend.com/api/emails
```

## Firebase Configuration

### 1. Enable Cloud Messaging
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Generate a VAPID key pair
3. Add the VAPID key to your environment variables

### 2. Update Service Worker
Replace the placeholder Firebase config in `public/firebase-messaging-sw.js` with your actual Firebase configuration.

### 3. Firebase Rules
Ensure your Firestore rules allow:
- Reading/writing invitations
- Updating user preferences (invitedMembers)
- Managing FCM tokens

## API Endpoints Required

Your backend should implement these endpoints:

### 1. Push Notification Webhook
```
POST /api/notifications
Content-Type: application/json

{
  "type": "push_notification",
  "userId": "user-id",
  "notification": {
    "title": "New Invitation",
    "body": "You have been invited to collaborate",
    "data": {
      "type": "invitation",
      "invitationId": "invitation-id"
    }
  }
}
```

### 2. Push Notification by Email
```
POST /api/notifications
Content-Type: application/json

{
  "type": "push_notification_by_email",
  "email": "user@example.com",
  "notification": {
    "title": "New Invitation",
    "body": "You have been invited to collaborate",
    "data": {
      "type": "invitation",
      "invitationId": "invitation-id"
    }
  }
}
```

## Usage

### 1. Invite Member
```typescript
// In SettingsScreen.tsx
await invitationService.createInvitation({
  ownerId: user.uid,
  ownerEmail: user.email,
  ownerName: user.displayName,
  inviteeEmail: 'newmember@example.com'
});
```

### 2. Accept Invitation
```typescript
// In NotificationContext.tsx
await invitationService.acceptInvitation(invitationId);
```

### 3. Reject Invitation
```typescript
// In NotificationContext.tsx
await invitationService.rejectInvitation(invitationId);
```

### 4. Uninvite Member
```typescript
// In SettingsScreen.tsx
await invitationService.uninviteMember(ownerId, inviteeEmail);
```

### 5. Request Push Notification Permission
```typescript
// In NotificationContext.tsx
const granted = await notificationService.requestPermission();
```

## Notification Types

The system handles these notification types:

1. **invitation** - New invitation received
2. **invitation_accepted** - Invitation accepted by invitee
3. **invitation_rejected** - Invitation rejected by invitee
4. **uninvite** - Invitation cancelled by owner

## Data Flow

### Invitation Process
1. Owner invites member → Creates invitation document
2. Sends email notification (existing)
3. Sends push notification to invitee
4. Invitee receives notification and can accept/reject

### Acceptance Process
1. Invitee accepts → Updates invitation status
2. Sends push notification to owner
3. Switches active owner for transactions/savings

### Rejection Process
1. Invitee rejects → Updates invitation status
2. Sends push notification to owner
3. Removes invitee from owner's invitedMembers list
4. Schedules deletion of invitation document (24 hours)

### Uninvite Process
1. Owner uninvites → Deletes invitation document
2. Removes invitee from owner's invitedMembers list
3. Sends push notification to invitee about cancellation

## Error Handling

- **Graceful fallbacks** when push notifications fail
- **Retry mechanisms** for failed operations
- **User feedback** for all operations
- **Logging** for debugging and monitoring

## Security Considerations

- **VAPID key** should be kept secure
- **Webhook endpoints** should be authenticated
- **Firestore rules** should restrict access appropriately
- **User permissions** should be validated on all operations

## Testing

1. **Enable push notifications** in browser settings
2. **Test invitation flow** end-to-end
3. **Verify notifications** are received
4. **Test data cleanup** after rejection
5. **Test uninvite functionality**

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Limited support (iOS 16.4+)
- **Mobile browsers**: Varies by platform

## Troubleshooting

### Common Issues
1. **Service worker not registering**: Check Firebase config
2. **Notifications not received**: Verify VAPID key and permissions
3. **Webhook failures**: Check backend endpoint and authentication
4. **Data not cleaning up**: Check Firestore rules and error logs

### Debug Steps
1. Check browser console for errors
2. Verify Firebase configuration
3. Test webhook endpoints manually
4. Check Firestore security rules
5. Verify environment variables are set correctly
