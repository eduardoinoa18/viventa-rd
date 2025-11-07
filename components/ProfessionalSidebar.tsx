// components/ProfessionalSidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  FiGrid,
  FiHome,
  FiUsers,
  FiCalendar,
  FiMessageSquare,
  FiSettings,
  FiUser,
  FiBarChart2,
  FiClipboard,
  FiChevronLeft,
  FiDollarSign,
  FiTrendingUp,
  FiBriefcase,
  FiFileText,
} from 'react-icons/fi'

type Props = {
  role: 'agent' | 'broker'
  userName?: string
  professionalCode?: string
}

export default function ProfessionalSidebar({ role, userName, professionalCode }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('professional_sidebar_collapsed')
    if (saved) setCollapsed(saved === '1')
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem('professional_sidebar_collapsed', next ? '1' : '0')
    } catch {}
  }

  const agentLinks = [
    { href: '/agent', label: 'Dashboard', icon: <FiGrid /> },
    { href: '/agent/listings', label: 'Mis Listados', icon: <FiHome /> },
    { href: '/agent/listings/create', label: 'Crear Listado', icon: <FiFileText /> },
    { href: '/agent/leads', label: 'Leads', icon: <FiUsers /> },
    { href: '/agent/calendar', label: 'Calendario', icon: <FiCalendar /> },
    { href: '/agent/messages', label: 'Mensajes', icon: <FiMessageSquare /> },
    { href: '/agent/analytics', label: 'Analytics', icon: <FiBarChart2 /> },
    { href: '/agent/profile', label: 'Mi Perfil', icon: <FiUser /> },
    { href: '/agent/settings', label: 'Configuración', icon: <FiSettings /> },
  ]

  const brokerLinks = [
    { href: '/broker', label: 'Dashboard', icon: <FiGrid /> },
    { href: '/broker/team', label: 'Mi Equipo', icon: <FiUsers /> },
    { href: '/broker/listings', label: 'Listados', icon: <FiHome /> },
    { href: '/broker/analytics', label: 'Analytics', icon: <FiBarChart2 /> },
    { href: '/broker/commissions', label: 'Comisiones', icon: <FiDollarSign /> },
    { href: '/broker/reports', label: 'Reportes', icon: <FiClipboard /> },
    { href: '/broker/settings', label: 'Configuración', icon: <FiSettings /> },
  ]

  const links = role === 'agent' ? agentLinks : brokerLinks

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 min-h-screen p-3 transition-all duration-300 shadow-lg`}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-[#0B2545] tracking-wide">
              {role === 'agent' ? 'PORTAL AGENTE' : 'PORTAL BRÓKER'}
            </div>
            {professionalCode && (
              <div className="text-xs text-gray-500 mt-1">{professionalCode}</div>
            )}
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-[#00A676] hover:to-[#008F64] hover:text-white text-gray-600 transition-all duration-200 hover:shadow-md"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FiChevronLeft
            className={`${collapsed ? 'rotate-180' : ''} transition-transform duration-300`}
          />
        </button>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
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
          <div className="text-xs font-bold text-blue-900 mb-2 tracking-wide">
            ACCESOS RÁPIDOS
          </div>
          <div className="space-y-2">
            {role === 'agent' ? (
              <>
                <Link
                  href="/agent/listings/create"
                  className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2"
                >
                  <FiFileText className="text-blue-600" /> <span>Nuevo Listado</span>
                </Link>
                <Link
                  href="/agent/leads"
                  className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2"
                >
                  <FiUsers className="text-blue-600" /> <span>Ver Leads</span>
                </Link>
                <Link
                  href="/agent/calendar"
                  className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2"
                >
                  <FiCalendar className="text-blue-600" /> <span>Mi Agenda</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/broker/team"
                  className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2"
                >
                  <FiUsers className="text-blue-600" /> <span>Gestionar Equipo</span>
                </Link>
                <Link
                  href="/broker/analytics"
                  className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2"
                >
                  <FiTrendingUp className="text-blue-600" /> <span>Ver Reportes</span>
                </Link>
                <Link
                  href="/broker/commissions"
                  className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2"
                >
                  <FiDollarSign className="text-blue-600" /> <span>Comisiones</span>
                </Link>
              </>
            )}
            <Link
              href="/"
              className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2"
            >
              <span>🌐</span> Sitio Público
            </Link>
          </div>
        </div>
      )}

      {!collapsed && userName && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Bienvenido</div>
          <div className="text-sm font-semibold text-gray-800 truncate">{userName}</div>
        </div>
      )}
    </aside>
  )
}
