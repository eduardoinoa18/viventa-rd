import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
export { acceptInvite } from './acceptInvite'
export { logAdminAction } from './auditLog'
export { sendAdminCode, verifyAdminCode } from './adminAuth'
export { processApplication } from './applications'
export { sendPushNotification } from './sendPush'

admin.initializeApp()
