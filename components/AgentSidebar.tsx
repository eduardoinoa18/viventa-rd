'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiActivity, FiBarChart2, FiCheckSquare, FiChevronLeft, FiDollarSign,
  FiGrid, FiHome, FiMessageSquare, FiPlusSquare, FiSettings,
  FiTarget, FiTrendingUp, FiUsers,
} from 'react-icons/fi'
import BrandLogo from '@/components/BrandLogo'

type NavItem = { href: string; label: string; icon: React.ReactNode; badge?: number }

const PRIMARY: NavItem[] = [
  { href: '/dashboard/agent/overview',    label: 'Resumen',      icon: <FiGrid /> },
  { href: '/dashboard/agent/crm',         label: 'Leads',        icon: <FiTarget /> },
  { href: '/dashboard/listings',          label: 'Propiedades',  icon: <FiHome /> },
]

const SECONDARY: NavItem[] = [
  { href: '/dashboard/agent/profile',     label: 'Perfil',       icon: <FiSettings /> },
  { href: '/dashboard/agent/deals',       label: 'Negocios',     icon: <FiTrendingUp /> },
  { href: '/dashboard/agent/clients',     label: 'Clientes',     icon: <FiUsers /> },
  { href: '/dashboard/agent/commissions', label: 'Comisiones',   icon: <FiBarChart2 /> },
]

const SYSTEM: NavItem[] = [
  { href: '/dashboard/agent/tasks',       label: 'Tareas',       icon: <FiCheckSquare /> },
  { href: '/dashboard/agent/activity',    label: 'Actividad',    icon: <FiActivity /> },
]

function SidebarLink({ item, collapsed, pathname }: { item: NavItem; collapsed: boolean; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(item.href + '/')
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-[#00A676] to-[#008F64] font-semibold text-white shadow-md'
          : 'text-gray-600 hover:translate-x-0.5 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className="shrink-0 text-lg">{item.icon}</span>
      {!collapsed && (
        <span className="flex min-w-0 flex-1 items-center justify-between text-sm">
          <span className="truncate">{item.label}</span>
          {item.badge ? (
            <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          ) : null}
        </span>
      )}
    </Link>
  )
}

function NavSection({ items, label, collapsed, pathname }: { items: NavItem[]; label?: string; collapsed: boolean; pathname: string }) {
  return (
    <div className="mt-3 first:mt-0">
      {label && !collapsed && (
        <div className="mb-1 px-3 text-[10px] font-bold tracking-widest text-gray-400">{label}</div>
      )}
      {items.map((item) => (
        <SidebarLink key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
      ))}
    </div>
  )
}

export default function AgentSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadActivity, setUnreadActivity] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('agent_sidebar_collapsed')
    if (saved) setCollapsed(saved === '1')
  }, [])

  useEffect(() => {
    fetch('/api/activity-events/summary', { cache: 'no-store' })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}))
        if (!r.ok || !body?.ok) return
        setUnreadActivity(Number(body?.summary?.unreadActivity || 0))
      })
      .catch(() => {})
  }, [pathname])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('agent_sidebar_collapsed', next ? '1' : '0') } catch {}
  }

  const systemWithBadge = SYSTEM.map((item) =>
    item.href === '/dashboard/agent/activity' && unreadActivity > 0
      ? { ...item, badge: unreadActivity } : item)

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-72'} min-h-screen border-r border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3 shadow-lg transition-all duration-300`}>
      <div className="mb-5 flex items-center justify-between px-2">
        {!collapsed ? (
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo className="h-7 w-auto" />
            <span className="truncate text-xs font-bold tracking-wide text-[#0B2545]">AGENT WORKSPACE</span>
          </div>
        ) : (
          <BrandLogo iconOnly className="h-7 w-7" />
        )}
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-gray-500 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#00A676] hover:to-[#008F64] hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FiChevronLeft className={`${collapsed ? 'rotate-180' : ''} transition-transform duration-300`} />
        </button>
      </div>

      <nav>
        <NavSection items={PRIMARY}          label="PRIMARY"   collapsed={collapsed} pathname={pathname} />
        <NavSection items={SECONDARY}        label="SECONDARY" collapsed={collapsed} pathname={pathname} />
        <NavSection items={systemWithBadge} label="SYSTEM"    collapsed={collapsed} pathname={pathname} />
      </nav>

      {!collapsed && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-inner">
          <div className="mb-2 text-xs font-bold tracking-wide text-blue-900">SHORTCUTS</div>
          <div className="space-y-2">
            <Link href="/dashboard/listings/create" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline">
              <FiPlusSquare className="text-blue-600" /> <span>Crear propiedad</span>
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline">
              <FiSettings className="text-blue-600" /> <span>Perfil</span>
            </Link>
            <Link href="/messages" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline">
              <FiMessageSquare className="text-blue-600" /> <span>Mensajes</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline">
              <span>🌐</span> <span>Public Site</span>
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
