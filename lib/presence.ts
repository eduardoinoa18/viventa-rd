// lib/presence.ts
// Lightweight presence tracking for users and professionals
// Updates Firestore users/{uid} with online + lastSeen periodically

import { db } from '@/lib/firebaseClient'
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

let heartbeatTimer: any = null

export function startPresence(uid: string) {
  if (!uid) return
  const userRef = doc(db, 'users', uid)

  // Mark online immediately
  setDoc(userRef, { online: true, lastSeen: serverTimestamp() }, { merge: true }).catch(() => {})

  // Heartbeat every 30s
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = setInterval(() => {
    updateDoc(userRef, { online: true, lastSeen: serverTimestamp() }).catch(() => {})
  }, 30_000)

  // Handle tab visibility
  const onVisibility = () => {
    if (document.hidden) {
      updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(() => {})
    } else {
      updateDoc(userRef, { online: true, lastSeen: serverTimestamp() }).catch(() => {})
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  // On unload, best-effort set offline
  const onUnload = () => {
    navigator.sendBeacon?.('/api/presence/off', JSON.stringify({ uid }))
  }
  window.addEventListener('beforeunload', onUnload)

  return () => {
    try { clearInterval(heartbeatTimer) } catch {}
    heartbeatTimer = null
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('beforeunload', onUnload)
    updateDoc(userRef, { online: false, lastSeen: serverTimestamp() }).catch(() => {})
  }
}
