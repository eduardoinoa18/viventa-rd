# Admin Push Notifications — Quick Integration Guide

This guide shows how to integrate and use the new FCM push notification system.

## What was added

1. **Admin UI** (`/admin/push`)
   - Compose push notifications with title, body, and image
   - Target: all users, specific roles, specific user IDs, or test mode
   - Live preview of notification
   - Send via Cloud Function

2. **Client FCM helpers** (`lib/fcmClient.ts`)
   - `requestNotificationPermission(uid)` — request browser permission, get FCM token, save to Firestore
   - `setupForegroundMessageListener()` — show in-app notifications when app is open

3. **Cloud Function** (`functions/src/sendPush.ts`)
   - `sendPushNotification` callable function (admin-only)
   - Sends multicast messages via Firebase Admin
   - Logs campaigns to `push_logs` collection

4. **Firebase client updates** (`lib/firebaseClient.ts`)
   - Added messaging support with `getMessagingInstance()` helper
   - Browser support check via `isSupported()`

5. **Setup documentation** (`FCM-PUSH-SETUP.md`)
   - VAPID key generation
   - Environment variables
   - Service worker configuration
   - Security rules
   - Testing and monitoring

## How to use (quick start)

### 1. Generate VAPID keys
```bash
npm install -g web-push
web-push generate-vapid-keys
```

Add to `.env.local` and Vercel:
```
NEXT_PUBLIC_FCM_VAPID_KEY=<your-public-key>
```

### 2. Request permission on user login

In your login/dashboard component:
```typescript
import { requestNotificationPermission, setupForegroundMessageListener } from '@/lib/fcmClient'

// After successful login
const user = auth.currentUser
if (user) {
  await requestNotificationPermission(user.uid)
  await setupForegroundMessageListener()
}
```

### 3. Deploy Cloud Function
```bash
cd functions
npm install
npm run build
firebase deploy --only functions:sendPushNotification
```

### 4. Send a test push

1. Go to `/admin/push`
2. Enter title and body
3. Select "Test (admin only)"
4. Click Send
5. You should receive a notification (if you've saved your token)

## What to configure

- Add VAPID keys to environment (client public key)
- Update service worker with Firebase config (optional if using next-pwa)
- Deploy the Cloud Function
- Update Firestore rules to allow users to write their own `fcmTokens`

## Architecture

```
[Client]
  ↓ requestNotificationPermission(uid)
  → Browser permission
  → getToken(messaging, vapidKey)
  → Save to Firestore users/{uid}/fcmTokens

[Admin UI] /admin/push
  ↓ Compose message + select target
  → Call Cloud Function sendPushNotification

[Cloud Function] sendPushNotification
  ↓ Verify admin role
  → Query Firestore for target user tokens
  → Send via admin.messaging().sendEachForMulticast()
  → Log to push_logs collection

[User Device]
  ← FCM delivers notification
  → Service worker shows notification
```

## Next steps

- Test with real users after deploying function
- Monitor `push_logs` collection for delivery stats
- Add scheduling for saved searches (future sprint)
- Consider segmentation by city, price range, or property type

See `FCM-PUSH-SETUP.md` for full setup and troubleshooting.
