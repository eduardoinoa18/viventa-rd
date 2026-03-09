'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import NotificationCenter from '@/components/NotificationCenter'

type SessionShape = {
  uid?: string
  role?: string
}

const MODULE_LINKS = [
  { href: '/master', label: 'Dashboard' },
  { href: '/master/users', label: 'People' },
  { href: '/master/offices', label: 'Offices' },
  { href: '/master/listings', label: 'Listings' },
  { href: '/master/leads', label: 'Leads' },
  { href: '/master/applications', label: 'Applications' },
  { href: '/master/settings', label: 'Settings' },
]

export default function MasterPanelTopbar() {
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

  return (
    <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-2">
            {MODULE_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        {session.uid ? <NotificationCenter userId={session.uid} /> : null}
      </div>
    </div>
  )
}
