'use client'

import { useEffect, useState } from 'react'

const CACHE_KEY = 'dashboard_unread_activity_v1'
const CACHE_TTL_MS = 45 * 1000

type CachePayload = {
  value: number
  at: number
}

function readCache(): CachePayload | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachePayload
    if (!Number.isFinite(parsed?.value) || !Number.isFinite(parsed?.at)) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(value: number) {
  try {
    const payload: CachePayload = { value: Math.max(0, Number(value || 0)), at: Date.now() }
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Best-effort cache only.
  }
}

export function useUnreadActivity(trigger: string): number {
  const [unreadActivity, setUnreadActivity] = useState(0)

  useEffect(() => {
    let active = true

    const cached = readCache()
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setUnreadActivity(cached.value)
    }

    const controller = new AbortController()

    fetch('/api/activity-events/summary', {
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-store' },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!active || !response.ok || !payload?.ok) return
        const next = Number(payload?.summary?.unreadActivity || 0)
        setUnreadActivity(next)
        writeCache(next)
      })
      .catch(() => {})

    return () => {
      active = false
      controller.abort()
    }
  }, [trigger])

  return unreadActivity
}