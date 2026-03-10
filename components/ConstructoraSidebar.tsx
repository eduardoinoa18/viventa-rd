// components/ConstructoraSidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiGrid, FiHome, FiPackage, FiCalendar, FiTrendingUp, FiChevronLeft, FiPlusSquare, FiMessageSquare, FiDollarSign, FiUsers, FiLayers } from 'react-icons/fi'
import BrandLogo from './BrandLogo'

export default function ConstructoraSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('constructora_sidebar_collapsed')
    if (saved) setCollapsed(saved === '1')
  }, [])
  
  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('constructora_sidebar_collapsed', next ? '1' : '0') } catch {}
  }
  
  const links = [
    { href: '/dashboard/constructora/overview', label: 'Dashboard', icon: <FiGrid /> },
    { href: '/dashboard/constructora/projects', label: 'Proyectos', icon: <FiLayers /> },
    { href: '/dashboard/constructora/units', label: 'Unidades', icon: <FiPackage /> },
    { href: '/dashboard/constructora/reservations', label: 'Reservas', icon: <FiCalendar /> },
    { href: '/dashboard/constructora/deals', label: 'Deals', icon: <FiTrendingUp /> },
    { href: '/constructoras', label: 'Directorio', icon: <FiUsers /> },
    { href: '/dashboard/listings', label: 'Listings', icon: <FiHome /> },
    { href: '/messages', label: 'Mensajes', icon: <FiMessageSquare /> },
    { href: '/dashboard/billing', label: 'Billing', icon: <FiDollarSign /> },
  ]

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 min-h-screen p-3 transition-all duration-300 shadow-lg`}>
      <div className="flex items-center justify-between mb-4 px-2">
        {!collapsed ? (
          <div className="flex items-center gap-2 min-w-0">
            <BrandLogo className="h-7 w-auto" />
            <div className="text-xs font-bold text-[#0B2545] tracking-wide truncate">CONSTRUCTORA</div>
          </div>
        ) : (
          <BrandLogo iconOnly className="h-7 w-7" />
        )}
        <button 
          onClick={toggleCollapsed} 
          className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-[#00A676] hover:to-[#008F64] hover:text-white text-gray-600 transition-all duration-200 hover:shadow-md" 
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FiChevronLeft className={`${collapsed ? 'rotate-180' : ''} transition-transform duration-300`} />
        </button>
      </div>
      <nav className="space-y-2">
        {links.map(link => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              pathname === link.href
                ? 'bg-gradient-to-r from-[#00A676] to-[#008F64] text-white font-semibold shadow-md transform scale-105'
                : 'hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 text-gray-700 hover:shadow-sm hover:translate-x-1'
            }`}
          >
            <span className="text-xl shrink-0">{link.icon}</span>
            {!collapsed && <span className="truncate">{link.label}</span>}
          </Link>
        ))}
      </nav>
      {!collapsed && (
        <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-inner border border-blue-100">
          <div className="text-xs font-bold text-blue-900 mb-2 tracking-wide">ACCIONES RÁPIDAS</div>
          <div className="space-y-2">
            <Link href="/dashboard/listings/create" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
              <FiPlusSquare className="text-blue-600" /> <span>Crear Propiedad</span>
            </Link>
            <Link href="/dashboard/constructora/projects" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
              <FiLayers className="text-blue-600" /> <span>Ver Proyectos</span>
            </Link>
            <Link href="/dashboard/constructora/units" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
              <FiPackage className="text-blue-600" /> <span>Ver Inventario</span>
            </Link>
            <Link href="/dashboard" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
              <span>🏠</span> Dashboard Principal
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
