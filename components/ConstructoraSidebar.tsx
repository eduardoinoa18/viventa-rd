// components/ConstructoraSidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiActivity, FiCalendar, FiChevronLeft, FiDollarSign,
  FiGrid, FiHome, FiLayers, FiMessageSquare, FiPackage,
  FiPlusSquare, FiTrendingUp, FiUsers,
} from 'react-icons/fi'
import BrandLogo from './BrandLogo'

type NavItem = { href: string; label: string; icon: React.ReactNode; badge?: number }

const PRIMARY: NavItem[] = [
  { href: '/dashboard/constructora/overview',     label: 'Overview',    icon: <FiGrid /> },
  { href: '/dashboard/constructora/projects',     label: 'Proyectos',   icon: <FiLayers /> },
  { href: '/dashboard/constructora/deals',        label: 'Deals',       icon: <FiTrendingUp /> },
]

const SECONDARY: NavItem[] = [
  { href: '/dashboard/constructora/units',        label: 'Inventario',  icon: <FiPackage /> },
  { href: '/dashboard/constructora/reservations', label: 'Reservas',    icon: <FiCalendar /> },
  { href: '/dashboard/listings',                  label: 'Listings',    icon: <FiHome /> },
]

const SYSTEM: NavItem[] = [
  { href: '/dashboard/constructora/clients',      label: 'Clients',     icon: <FiUsers /> },
  { href: '/dashboard/constructora/activity',     label: 'Activity',    icon: <FiActivity /> },
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

export default function ConstructoraSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('constructora_sidebar_collapsed')
    if (saved) setCollapsed(saved === '1')
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('constructora_sidebar_collapsed', next ? '1' : '0') } catch {}
  }

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} min-h-screen border-r border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3 shadow-lg transition-all duration-300`}>
      <div className="mb-5 flex items-center justify-between px-2">
        {!collapsed ? (
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo className="h-7 w-auto" />
            <span className="truncate text-xs font-bold tracking-wide text-[#0B2545]">CONSTRUCTORA</span>
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
        <NavSection items={PRIMARY}   label="PRIMARY"   collapsed={collapsed} pathname={pathname} />
        <NavSection items={SECONDARY} label="SECONDARY" collapsed={collapsed} pathname={pathname} />
        <NavSection items={SYSTEM}    label="SYSTEM"    collapsed={collapsed} pathname={pathname} />
      </nav>

      {!collapsed && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-inner">
          <div className="mb-2 text-xs font-bold tracking-wide text-blue-900">ACCESOS</div>
          <div className="space-y-2">
            <Link href="/dashboard/listings/create" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline">
              <FiPlusSquare className="text-blue-600" /> <span>Crear Propiedad</span>
            </Link>
            <Link href="/messages" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline">
              <FiMessageSquare className="text-blue-600" /> <span>Mensajes</span>
            </Link>
            <Link href="/dashboard/billing" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline">
              <FiDollarSign className="text-blue-600" /> <span>Billing</span>
            </Link>
            <Link href="/constructoras" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline">
              <FiUsers className="text-blue-600" /> <span>Directorio</span>
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
