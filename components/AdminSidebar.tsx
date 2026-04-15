// components/AdminSidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiGrid, FiUsers, FiUser, FiHome, FiSettings, FiPlusSquare, FiClipboard, FiTarget, FiActivity, FiChevronLeft, FiCpu, FiDollarSign, FiShield, FiTrendingUp, FiMap, FiMail, FiZap } from 'react-icons/fi'
import { getSession } from '@/lib/authSession'
import BrandLogo from './BrandLogo'

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<string>('master_admin')
  const [unreadActivity, setUnreadActivity] = useState(0)

  // Persist collapsed state & get user role
  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed')
    if (saved) setCollapsed(saved === '1')
    
    // Get user role from session
    const session = getSession()
    if (session?.role) setUserRole(session.role)
  }, [])

  useEffect(() => {
    fetch('/api/activity-events/summary', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload?.ok) return
        setUnreadActivity(Number(payload?.summary?.unreadActivity || 0))
      })
      .catch(() => {})
  }, [pathname])
  
  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('admin_sidebar_collapsed', next ? '1' : '0') } catch {}
  }
  
  // Define navigation based on role — three-tier hierarchy
  const allPrimary = [
    { href: '/master',            label: 'Panel',   icon: <FiGrid />,     roles: ['master_admin', 'admin'] },
    { href: '/master/listings',   label: userRole === 'agent' ? 'Mis Propiedades' : userRole === 'broker' ? 'Propiedades Equipo' : userRole === 'constructora' ? 'Propiedades Proyecto' : 'Propiedades', icon: <FiHome />, roles: ['master_admin', 'admin', 'agent', 'broker', 'constructora'] },
    { href: '/master/leads',      label: userRole === 'agent' ? 'Mis Leads' : userRole === 'constructora' ? 'Leads Proyecto' : 'Leads', icon: <FiTarget />, roles: ['master_admin', 'admin', 'agent', 'broker', 'constructora'] },
  ]

  const allSecondary = [
    { href: '/master/users',      label: 'Personas',      icon: <FiUsers />,    roles: ['master_admin', 'admin', 'broker'] },
    { href: '/master/buyers',     label: 'Compradores',   icon: <FiUser />,     roles: ['master_admin', 'admin', 'broker'] },
    { href: '/master/offices',    label: 'Oficinas',      icon: <FiMap />,      roles: ['master_admin', 'admin'] },
    { href: '/master/applications', label: 'Solicitudes', icon: <FiClipboard />, roles: ['master_admin', 'admin'] },
  ]

  const allSystem = [
    { href: '/master/overview',         label: 'Inteligencia',     icon: <FiTrendingUp />, roles: ['master_admin'] },
    { href: '/master/activity',         label: 'Actividad',        icon: <FiActivity />,   roles: ['master_admin', 'admin'] },
    { href: '/master/automation',       label: 'Automatizacion',   icon: <FiZap />,        roles: ['master_admin'] },
    { href: '/master/recommendations',  label: 'Recomendaciones',  icon: <FiMail />,       roles: ['master_admin'] },
  ]

  const primary   = allPrimary.filter(l => l.roles.includes(userRole))
  const secondary = allSecondary.filter(l => l.roles.includes(userRole))
  const system    = allSystem.filter(l => l.roles.includes(userRole))

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 min-h-screen p-3 transition-all duration-300 shadow-lg`}>
      <div className="flex items-center justify-between mb-5 px-2">
        {!collapsed ? (
          <div className="flex items-center gap-2 min-w-0">
            <BrandLogo className="h-7 w-auto" />
            <span className="text-xs font-bold text-[#0B2545] tracking-wide truncate">ADMIN PORTAL</span>
          </div>
        ) : (
          <BrandLogo iconOnly className="h-7 w-7" />
        )}
        <button 
          onClick={toggleCollapsed} 
          className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-[#00A676] hover:to-[#008F64] hover:text-white text-gray-500 transition-all duration-200" 
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FiChevronLeft className={`${collapsed ? 'rotate-180' : ''} transition-transform duration-300`} />
        </button>
      </div>
      <nav>
        {/* PRINCIPAL */}
        <div className="mt-0">
          {!collapsed && <div className="mb-1 px-3 text-[10px] font-bold tracking-widest text-gray-400">PRINCIPAL</div>}
          {primary.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link key={link.href} href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${active ? 'bg-gradient-to-r from-[#00A676] to-[#008F64] text-white font-semibold shadow-md' : 'text-gray-600 hover:translate-x-0.5 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <span className="text-lg shrink-0">{link.icon}</span>
                {!collapsed && <span className="truncate text-sm">{link.label}</span>}
              </Link>
            )
          })}
        </div>
        {/* GESTION */}
        <div className="mt-3">
          {!collapsed && <div className="mb-1 px-3 text-[10px] font-bold tracking-widest text-gray-400">GESTION</div>}
          {secondary.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link key={link.href} href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${active ? 'bg-gradient-to-r from-[#00A676] to-[#008F64] text-white font-semibold shadow-md' : 'text-gray-600 hover:translate-x-0.5 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <span className="text-lg shrink-0">{link.icon}</span>
                {!collapsed && <span className="truncate text-sm">{link.label}</span>}
              </Link>
            )
          })}
        </div>
        {/* SISTEMA */}
        <div className="mt-3">
          {!collapsed && <div className="mb-1 px-3 text-[10px] font-bold tracking-widest text-gray-400">SISTEMA</div>}
          {system.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            const badge = link.href === '/master/activity' && unreadActivity > 0 ? unreadActivity : 0
            return (
              <Link key={link.href} href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${active ? 'bg-gradient-to-r from-[#00A676] to-[#008F64] text-white font-semibold shadow-md' : 'text-gray-600 hover:translate-x-0.5 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <span className="text-lg shrink-0">{link.icon}</span>
                {!collapsed && (
                  <span className="flex min-w-0 flex-1 items-center justify-between text-sm">
                    <span className="truncate">{link.label}</span>
                    {badge > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">{badge > 9 ? '9+' : badge}</span>}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
      {!collapsed && (
        <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-inner border border-blue-100">
          <div className="text-xs font-bold text-blue-900 mb-2 tracking-wide">TOOLS</div>
          <div className="space-y-2">
            {['master_admin'].includes(userRole) && (
              <Link href="/master/control" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
                <FiCpu className="text-blue-600" /> <span>Control Center</span>
              </Link>
            )}
            {['master_admin'].includes(userRole) && (
              <Link href="/master/revenue" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
                <FiDollarSign className="text-blue-600" /> <span>Ingresos</span>
              </Link>
            )}
            {['master_admin'].includes(userRole) && (
              <Link href="/master/reviews" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
                <FiShield className="text-blue-600" /> <span>Resenas</span>
              </Link>
            )}
            {['master_admin'].includes(userRole) && (
              <Link href="/master/settings" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
                <FiSettings className="text-blue-600" /> <span>Configuracion</span>
              </Link>
            )}
            {['master_admin', 'admin', 'agent', 'broker', 'constructora'].includes(userRole) && (
              <Link href="/master/listings/create" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
                <FiPlusSquare className="text-blue-600" /> <span>Crear Propiedad</span>
              </Link>
            )}
            {['master_admin', 'admin', 'broker'].includes(userRole) && (
              <Link href="/master/users" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
                <FiUsers className="text-blue-600" /> <span>{userRole === 'broker' ? 'Gestionar Equipo' : 'Gestionar Personas'}</span>
              </Link>
            )}
            {['master_admin', 'admin', 'agent', 'broker', 'constructora'].includes(userRole) && (
              <Link href="/master/leads" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
                <FiTarget className="text-blue-600" /> <span>Gestionar Leads</span>
              </Link>
            )}
            <Link href="/" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
              <span>🌐</span> Ver Sitio Publico
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
