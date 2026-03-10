'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiBarChart2, FiChevronLeft, FiClipboard, FiGrid, FiHome, FiMessageSquare, FiPlusSquare, FiUsers, FiActivity, FiDollarSign } from 'react-icons/fi'
import BrandLogo from '@/components/BrandLogo'

type ActivitySummary = {
  unreadActivity: number
}

const links = [
  { href: '/dashboard/broker/overview', label: 'Overview', icon: <FiGrid /> },
  { href: '/dashboard/broker/crm', label: 'CRM', icon: <FiUsers /> },
  { href: '/dashboard/broker/transactions', label: 'Transactions', icon: <FiBarChart2 /> },
  { href: '/dashboard/broker/activity', label: 'Activity', icon: <FiActivity /> },
  { href: '/dashboard/broker/team', label: 'Team', icon: <FiClipboard /> },
  { href: '/dashboard/listings', label: 'Listings', icon: <FiHome /> },
]

export default function BrokerSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [summary, setSummary] = useState<ActivitySummary>({ unreadActivity: 0 })

  useEffect(() => {
    const saved = localStorage.getItem('broker_sidebar_collapsed')
    if (saved) setCollapsed(saved === '1')
  }, [])

  useEffect(() => {
    fetch('/api/activity-events/summary', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload?.ok) return
        setSummary({ unreadActivity: Number(payload?.summary?.unreadActivity || 0) })
      })
      .catch(() => {})
  }, [pathname])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('broker_sidebar_collapsed', next ? '1' : '0') } catch {}
  }

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-72'} min-h-screen border-r border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3 shadow-lg transition-all duration-300`}>
      <div className="mb-4 flex items-center justify-between px-2">
        {!collapsed ? (
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo className="h-7 w-auto" />
            <div className="truncate text-xs font-bold tracking-wide text-[#0B2545]">BROKER WORKSPACE</div>
          </div>
        ) : (
          <BrandLogo iconOnly className="h-7 w-7" />
        )}
        <button
          onClick={toggleCollapsed}
          className="rounded-lg p-2 text-gray-600 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#00A676] hover:to-[#008F64] hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FiChevronLeft className={`${collapsed ? 'rotate-180' : ''} transition-transform duration-300`} />
        </button>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href
          const isActivity = link.href === '/dashboard/broker/activity'
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg p-3 transition-all duration-200 ${active ? 'bg-gradient-to-r from-[#00A676] to-[#008F64] font-semibold text-white shadow-md' : 'text-gray-700 hover:translate-x-1 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50'}`}
            >
              <span className="shrink-0 text-xl">{link.icon}</span>
              {!collapsed && (
                <span className="truncate">
                  {isActivity && summary.unreadActivity > 0 ? `${link.label} (${summary.unreadActivity})` : link.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-inner">
          <div className="mb-2 text-xs font-bold tracking-wide text-blue-900">SHORTCUTS</div>
          <div className="space-y-2">
            <Link href="/dashboard/listings/create" className="flex items-center gap-2 text-sm text-blue-700 transition-colors hover:text-blue-900 hover:underline">
              <FiPlusSquare className="text-blue-600" /> <span>Create Listing</span>
            </Link>
            <Link href="/messages" className="flex items-center gap-2 text-sm text-blue-700 transition-colors hover:text-blue-900 hover:underline">
              <FiMessageSquare className="text-blue-600" /> <span>Messages</span>
            </Link>
            <Link href="/dashboard/billing" className="flex items-center gap-2 text-sm text-blue-700 transition-colors hover:text-blue-900 hover:underline">
              <FiDollarSign className="text-blue-600" /> <span>Billing</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm text-blue-700 transition-colors hover:text-blue-900 hover:underline">
              <span>🌐</span> <span>Public Site</span>
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
