'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUnreadActivity } from '@/hooks/useUnreadActivity'

type ActivitySummary = {
  unreadActivity: number
}

const PRIMARY_NAV_ITEMS = [
  { href: '/dashboard/broker/overview', label: 'Resumen' },
  { href: '/dashboard/broker/crm', label: 'CRM' },
  { href: '/dashboard/broker/activity', label: 'Actividad' },
  { href: '/dashboard/broker/team', label: 'Equipo' },
]

const SECONDARY_NAV_ITEMS = [
  { href: '/dashboard/listings', label: 'Propiedades' },
  { href: '/dashboard/listings/create', label: 'Crear Propiedad' },
  { href: '/dashboard/billing', label: 'Facturación' },
  { href: '/messages', label: 'Mensajes' },
]

export default function BrokerWorkspaceNav() {
  const pathname = usePathname()
  const unreadActivity = useUnreadActivity(pathname)

  return (
    <div className="mt-4 space-y-2 text-sm">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {PRIMARY_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        const isActivity = item.href === '/dashboard/broker/activity'
        const unread = unreadActivity

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
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {SECONDARY_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md border ${isActive ? 'border-[#0B2545] bg-[#0B2545] text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}