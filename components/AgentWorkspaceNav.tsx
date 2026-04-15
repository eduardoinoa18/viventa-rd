'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PRIMARY_NAV_ITEMS = [
  { href: '/dashboard/agent/overview', label: 'Resumen' },
  { href: '/dashboard/agent/crm', label: 'CRM' },
  { href: '/dashboard/agent/commissions', label: 'Comisiones' },
  { href: '/dashboard/agent/activity', label: 'Actividad' },
  { href: '/dashboard/listings', label: 'Propiedades' },
]

const SECONDARY_NAV_ITEMS = [
  { href: '/dashboard/listings/create', label: 'Crear Propiedad' },
  { href: '/dashboard/settings', label: 'Perfil' },
  { href: '/messages', label: 'Mensajes' },
  { href: '/notifications', label: 'Alertas' },
]

export default function AgentWorkspaceNav() {
  const pathname = usePathname()

  return (
    <div className="mt-4 space-y-2 text-sm">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-center px-3 py-2 rounded-lg border font-medium ${isActive ? 'border-[#0B2545] bg-[#0B2545] text-white' : 'border-gray-200 text-[#0B2545]'}`}
            >
              {item.label}
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
