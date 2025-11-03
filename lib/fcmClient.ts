// lib/fcmClient.ts
import { getToken, onMessage } from 'firebase/messaging'
import { getMessagingInstance } from './firebaseClient'
import { doc, setDoc, arrayUnion } from 'firebase/firestore'
import { db } from './firebaseClient'

/**
 * Request notification permission and get FCM token.
 * Saves token to Firestore users/{uid}/fcmTokens array.
 * Returns the token or null if permission denied or not supported.
 */
export async function requestNotificationPermission(uid: string): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null

    // Check if Notification API is available
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser')
      return null
    }

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return null
    }

    // Get messaging instance
    const messagingInstance = await getMessagingInstance()
    if (!messagingInstance) {
      console.warn('FCM messaging not supported')
      return null
    }

    // Get VAPID key from env
    const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY
    if (!vapidKey) {
      console.error('NEXT_PUBLIC_FCM_VAPID_KEY not set')
      return null
    }

    // Get FCM token
    const token = await getToken(messagingInstance, { vapidKey })

    if (token && uid && db) {
      // Save token to Firestore
      await setDoc(doc(db, 'users', uid), {
        fcmTokens: arrayUnion(token),
        lastTokenUpdate: new Date()
      }, { merge: true })
      console.log('✓ FCM token saved')
    }

    return token
  } catch (error) {
    console.error('FCM token error:', error)
    return null
  }
}

/**
 * Set up foreground message listener (for notifications when app is open).
 * Call this once when the user logs in or mounts the main layout.
 */
export async function setupForegroundMessageListener() {
  try {
    const messagingInstance = await getMessagingInstance()
    if (!messagingInstance) return

    onMessage(messagingInstance, (payload) => {
      console.log('Foreground message received:', payload)
      const { title, body, icon } = payload.notification || {}

      // Show browser notification
      if (title) {
        new Notification(title, {
          body: body || '',
          icon: icon || '/icons/icon-192.png',
          badge: '/icons/icon-72.png'
        })
      }
    })
  } catch (error) {
    console.error('Foreground message listener error:', error)
  }
}
