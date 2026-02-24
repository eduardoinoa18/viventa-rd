# FCM Web Push Notifications Setup

This guide covers setting up Firebase Cloud Messaging (FCM) for web push notifications, including VAPID keys, client integration, and admin send functionality.

## 1 — Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for web push.

### Option A: Using web-push library (recommended)
```bash
npm install -g web-push
web-push generate-vapid-keys
```

This outputs:
```
Public Key: <your-public-key>
Private Key: <your-private-key>
```

### Option B: Firebase Console
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Under "Web Push certificates" → Generate Key Pair
3. Copy both keys

## 2 — Configure Environment Variables

Add to your environment (Vercel, local `.env.local`):

```bash
# Client (public)
NEXT_PUBLIC_FCM_VAPID_KEY=<your-public-vapid-key>

# Server (private) - for Firebase Functions if sending from server
FCM_VAPID_KEY_PRIVATE=<your-private-vapid-key>
```

Also ensure you have:
```bash
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
```

## 3 — Client Integration

### A. Update firebase client config
Ensure `messaging` is initialized in `lib/firebaseClient.ts`:

```typescript
import { getMessaging, isSupported } from 'firebase/messaging'

export const messaging = async () => {
  const supported = await isSupported()
  return supported ? getMessaging(app) : null
}
```

### B. Request permission and get token
Create `lib/fcmClient.ts`:

```typescript
import { getToken } from 'firebase/messaging'
import { messaging } from './firebaseClient'
import { doc, setDoc, arrayUnion } from 'firebase/firestore'
import { db } from './firebaseClient'

export async function requestNotificationPermission(uid: string): Promise<string | null> {
  try {
    const messagingInstance = await messaging()
    if (!messagingInstance) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messagingInstance, {
      vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY
    })

    if (token && uid) {
      // Save token to Firestore
      await setDoc(doc(db, 'users', uid), {
        fcmTokens: arrayUnion(token),
        lastTokenUpdate: new Date()
      }, { merge: true })
    }

    return token
  } catch (error) {
    console.error('FCM token error:', error)
    return null
  }
}
```

### C. Service Worker for foreground messages
Update `public/service-worker.js` (or create `public/firebase-messaging-sw.js`):

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: '<your-api-key>',
  authDomain: '<your-auth-domain>',
  projectId: '<your-project-id>',
  storageBucket: '<your-storage-bucket>',
  messagingSenderId: '<your-sender-id>',
  appId: '<your-app-id>'
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('Background message:', payload)
  const { title, body, icon } = payload.notification || {}
  
  self.registration.showNotification(title || 'Viventa Notification', {
    body: body || '',
    icon: icon || '/icons/icon-192.png',
    badge: '/icons/icon-72.png'
  })
})
```

## 4 — Admin Send Function (Cloud Function)

Create `functions/src/sendPush.ts`:

```typescript
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const sendPushNotification = functions.https.onCall(async (data, context) => {
  // Verify caller is admin
  if (!context.auth || !['master_admin', 'admin'].includes(context.auth.token.role || '')) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only')
  }

  const { title, body, targetType, targetRoles, userIds, imageUrl } = data

  if (!title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Title and body required')
  }

  try {
    let tokens: string[] = []

    // Gather tokens based on target
    if (targetType === 'all') {
      const usersSnapshot = await admin.firestore().collection('users').get()
      usersSnapshot.docs.forEach(doc => {
        const userTokens = doc.data().fcmTokens || []
        tokens.push(...userTokens)
      })
    } else if (targetType === 'roles' && targetRoles?.length) {
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('role', 'in', targetRoles)
        .get()
      usersSnapshot.docs.forEach(doc => {
        const userTokens = doc.data().fcmTokens || []
        tokens.push(...userTokens)
      })
    } else if (targetType === 'users' && userIds?.length) {
      for (const uid of userIds) {
        const userDoc = await admin.firestore().collection('users').doc(uid).get()
        const userTokens = userDoc.data()?.fcmTokens || []
        tokens.push(...userTokens)
      }
    }

    // Remove duplicates
    tokens = [...new Set(tokens)]

    if (!tokens.length) {
      return { success: true, sent: 0, message: 'No tokens found' }
    }

    // Build message
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
        imageUrl
      },
      tokens
    }

    // Send
    const response = await admin.messaging().sendEachForMulticast(message)

    // Log results
    await admin.firestore().collection('push_logs').add({
      title,
      body,
      targetType,
      sentBy: context.auth.uid,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length
    })

    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      total: tokens.length
    }
  } catch (error: any) {
    console.error('Push send error:', error)
    throw new functions.https.HttpsError('internal', error.message)
  }
})
```

Deploy:
```bash
firebase deploy --only functions:sendPushNotification
```

## 5 — Test Push Locally

Use Firebase Emulator Suite:
```bash
firebase emulators:start --only functions
```

Or test in production with a single token (get from Firestore `users/{uid}/fcmTokens`):
```bash
curl -X POST https://fcm.googleapis.com/v1/projects/<project-id>/messages:send \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "<user-fcm-token>",
      "notification": {
        "title": "Test",
        "body": "Hello from Viventa"
      }
    }
  }'
```

## 6 — Security Rules

Update `firestore.rules` to allow users to write their own tokens:

```
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

## 7 — Monitoring

- Check Firebase Console → Cloud Messaging for delivery stats.
- Review `push_logs` collection in Firestore for admin-sent campaigns.
- Set up alerts for high failure rates.

## 8 — Production Checklist

- [ ] Generate VAPID keys and add to env (client + server)
- [ ] Update service worker with Firebase config
- [ ] Deploy `sendPushNotification` function
- [ ] Test token save on user login
- [ ] Test send from admin UI
- [ ] Verify notifications appear on desktop and mobile web
- [ ] Set up Firestore security rules for `fcmTokens`
