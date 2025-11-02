// lib/notificationService.ts
/**
 * Push Notification Service for Viventa RD
 * Handles FCM token registration and push notification management
 */

import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging'
import { db } from './firebaseClient'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export type NotificationType = 
  | 'new_message'
  | 'property_view'
  | 'lead_inquiry'
  | 'application_approved'
  | 'application_rejected'
  | 'badge_earned'
  | 'level_up'
  | 'new_property'
  | 'price_alert'
  | 'saved_search'

export interface NotificationPayload {
  type: NotificationType
  title: string
  body: string
  icon?: string
  url?: string
  data?: Record<string, any>
}

/**
 * Request notification permission and register FCM token
 */
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  try {
    // Check if notifications are supported
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

    // Get FCM token
    const messaging = getMessaging()
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    })

    if (!token) {
      console.error('Failed to get FCM token')
      return null
    }

    // Save token to Firestore
    await saveFCMToken(userId, token)
    
    // Set up foreground message handler
    setupForegroundNotificationHandler(messaging)

    return token
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return null
  }
}

/**
 * Save FCM token to user's profile
 */
async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, {
      fcmToken: token,
      fcmTokenUpdatedAt: serverTimestamp(),
      notificationsEnabled: true
    }, { merge: true })
    
    console.log('FCM token saved successfully')
  } catch (error) {
    console.error('Error saving FCM token:', error)
  }
}

/**
 * Handle foreground notifications (when app is open)
 */
function setupForegroundNotificationHandler(messaging: any) {
  onMessage(messaging, (payload: MessagePayload) => {
    console.log('Foreground message received:', payload)
    
    const { notification } = payload
    if (!notification) return

    // Show browser notification even when app is in foreground
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'Viventa RD', {
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: payload.messageId,
        data: payload.data
      })
    }

    // Optionally show in-app notification UI
    showInAppNotification({
      type: (payload.data?.type as NotificationType) || 'new_message',
      title: notification.title || 'Nueva notificación',
      body: notification.body || '',
      icon: notification.icon,
      url: payload.data?.url,
      data: payload.data
    })
  })
}

/**
 * Show in-app notification banner
 */
function showInAppNotification(notification: NotificationPayload) {
  // Create notification element
  const notificationEl = document.createElement('div')
  notificationEl.className = 'fixed top-20 right-4 z-50 bg-white shadow-2xl rounded-lg p-4 max-w-sm animate-slide-in border-l-4 border-[#00A676]'
  notificationEl.innerHTML = `
    <div class="flex items-start gap-3">
      ${notification.icon ? `<img src="${notification.icon}" class="w-12 h-12 rounded-full" />` : ''}
      <div class="flex-1">
        <div class="font-semibold text-gray-900">${notification.title}</div>
        <div class="text-sm text-gray-600 mt-1">${notification.body}</div>
        ${notification.url ? `<a href="${notification.url}" class="text-xs text-[#00A676] font-semibold mt-2 inline-block">Ver más →</a>` : ''}
      </div>
      <button class="text-gray-400 hover:text-gray-600" onclick="this.closest('div').remove()">×</button>
    </div>
  `

  document.body.appendChild(notificationEl)

  // Auto remove after 5 seconds
  setTimeout(() => {
    notificationEl.remove()
  }, 5000)
}

/**
 * Check if user has notification permission
 */
export function hasNotificationPermission(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Disable notifications for a user
 */
export async function disableNotifications(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, {
      notificationsEnabled: false,
      fcmToken: null,
      fcmTokenUpdatedAt: serverTimestamp()
    }, { merge: true })
    
    console.log('Notifications disabled successfully')
  } catch (error) {
    console.error('Error disabling notifications:', error)
  }
}

/**
 * Send notification via API (server-side)
 */
export async function sendNotification(
  userId: string,
  notification: NotificationPayload
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        notification
      })
    })

    const result = await response.json()
    return result.ok
  } catch (error) {
    console.error('Error sending notification:', error)
    return false
  }
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(userId: string) {
  try {
    const response = await fetch(`/api/notifications/preferences?userId=${userId}`)
    const result = await response.json()
    return result.ok ? result.data : null
  } catch (error) {
    console.error('Error getting notification preferences:', error)
    return null
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    messages?: boolean
    properties?: boolean
    achievements?: boolean
    marketing?: boolean
  }
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        preferences
      })
    })

    const result = await response.json()
    return result.ok
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return false
  }
}
