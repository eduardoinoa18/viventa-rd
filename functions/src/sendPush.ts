// functions/src/sendPush.ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

interface SendPushData {
  title: string
  body: string
  imageUrl?: string
  targetType: 'all' | 'roles' | 'users' | 'test'
  targetRoles?: string[]
  userIds?: string[]
}

/**
 * Callable function to send FCM push notifications.
 * Admin-only. Supports targeting all users, specific roles, specific user IDs, or test mode.
 */
export const sendPushNotification = functions.https.onCall(async (data: SendPushData, context) => {
  // Verify caller is authenticated and has admin privileges
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const callerRole = (context.auth.token as any).role || ''
  if (!['master_admin', 'admin'].includes(callerRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only')
  }

  const { title, body, targetType, targetRoles, userIds, imageUrl } = data

  // Validate required fields
  if (!title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Title and body are required')
  }

  try {
    let tokens: string[] = []

    // Gather tokens based on target type
    if (targetType === 'test') {
      // Test mode: send only to the caller's tokens
      const callerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get()
      const callerTokens = callerDoc.data()?.fcmTokens || []
      tokens.push(...callerTokens)
    } else if (targetType === 'all') {
      // All users
      const usersSnapshot = await admin.firestore().collection('users').get()
      usersSnapshot.docs.forEach(doc => {
        const userTokens = doc.data().fcmTokens || []
        tokens.push(...userTokens)
      })
    } else if (targetType === 'roles' && targetRoles && targetRoles.length > 0) {
      // Specific roles (Firestore 'in' query supports up to 10 values; chunk if needed)
      const roleChunks: string[][] = []
      for (let i = 0; i < targetRoles.length; i += 10) {
        roleChunks.push(targetRoles.slice(i, i + 10))
      }
      for (const chunk of roleChunks) {
        const usersSnapshot = await admin.firestore()
          .collection('users')
          .where('role', 'in', chunk)
          .get()
        usersSnapshot.docs.forEach(doc => {
          const userTokens = doc.data().fcmTokens || []
          tokens.push(...userTokens)
        })
      }
    } else if (targetType === 'users' && userIds && userIds.length > 0) {
      // Specific user IDs
      for (const uid of userIds) {
        const userDoc = await admin.firestore().collection('users').doc(uid).get()
        const userTokens = userDoc.data()?.fcmTokens || []
        tokens.push(...userTokens)
      }
    }

    // Remove duplicates
    tokens = [...new Set(tokens)]

    if (tokens.length === 0) {
      return {
        success: true,
        sent: 0,
        failed: 0,
        total: 0,
        message: 'No tokens found for target'
      }
    }

    // Build multicast message
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
        imageUrl: imageUrl || undefined
      },
      tokens
    }

    // Send to all tokens
    const response = await admin.messaging().sendEachForMulticast(message)

    // Log push campaign for analytics
    await admin.firestore().collection('push_logs').add({
      title,
      body,
      imageUrl: imageUrl || null,
      targetType,
      targetRoles: targetRoles || null,
      userIds: userIds || null,
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
    console.error('sendPushNotification error:', error)
    throw new functions.https.HttpsError('internal', error.message || 'Failed to send push')
  }
})
