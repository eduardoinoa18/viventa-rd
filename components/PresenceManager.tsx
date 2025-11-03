"use client"
import { useEffect } from 'react'
import { getSession } from '@/lib/authSession'
import { startPresence } from '@/lib/presence'

export default function PresenceManager() {
  useEffect(() => {
    const s = getSession()
    if (!s?.uid) return
    const stop = startPresence(s.uid)
    return () => { if (typeof stop === 'function') stop() }
  }, [])
  return null
}
