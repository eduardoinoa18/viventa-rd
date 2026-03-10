'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type ActivitySummary = {
  unreadActivity: number
}

const NAV_ITEMS = [
  { href: '/dashboard/broker/overview', label: 'Overview' },
  { href: '/dashboard/broker/crm', label: 'CRM' },
  { href: '/dashboard/broker/transactions', label: 'Transactions' },
  { href: '/dashboard/broker/activity', label: 'Activity' },
  { href: '/dashboard/broker/team', label: 'Team' },
  { href: '/dashboard/listings', label: 'Listings' },
  { href: '/dashboard/listings/create', label: 'Crear' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/messages', label: 'Mensajes' },
]

export default function BrokerWorkspaceNav() {
  const pathname = usePathname()
  const [summary, setSummary] = useState<ActivitySummary>({ unreadActivity: 0 })

  useEffect(() => {
    fetch('/api/activity-events/summary', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload?.ok) return
        setSummary({ unreadActivity: Number(payload?.summary?.unreadActivity || 0) })
      })
      .catch(() => {})
  }, [pathname])

  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 text-sm">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        const isActivity = item.href === '/dashboard/broker/activity'
        const unread = summary.unreadActivity

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-center px-3 py-2 rounded-lg border font-medium ${isActive ? 'border-[#0B2545] bg-[#0B2545] text-white' : 'border-gray-200 text-[#0B2545]'}`}
          >
            <span>
              {item.label}
              {isActivity && unread > 0 ? ` (${unread})` : ''}
            </span>
          </Link>
        )
      })}
    </div>
  )
}