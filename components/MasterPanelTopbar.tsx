'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import NotificationCenter from '@/components/NotificationCenter'

type SessionShape = {
  uid?: string
  role?: string
}

export default function MasterPanelTopbar() {
  const pathname = usePathname()
  const [session, setSession] = useState<SessionShape>({})

  useEffect(() => {
    let active = true
    async function loadSession() {
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!active) return
      setSession({
        uid: String(json?.session?.uid || ''),
        role: String(json?.session?.role || ''),
      })
    }
    loadSession()
    return () => {
      active = false
    }
  }, [])

  const canSeeMasterModules = session.role === 'master_admin' || session.role === 'admin' || session.role === 'broker'

  if (!canSeeMasterModules) return null

  const currentSection = String(pathname || '/master')
    .replace('/master', '')
    .split('/')
    .filter(Boolean)[0]

  const sectionLabel = currentSection
    ? `${currentSection.charAt(0).toUpperCase()}${currentSection.slice(1)}`
    : 'Dashboard'

  return (
    <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-gray-500">Master Admin</div>
          <div className="text-sm font-semibold text-[#0B2545] truncate">{sectionLabel}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/master"
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            Home
          </Link>
          <Link
            href="/master/overview"
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            Intelligence
          </Link>
          {session.uid ? <NotificationCenter userId={session.uid} /> : null}
        </div>
      </div>
    </div>
  )
}
