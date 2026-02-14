// components/AdminSidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiGrid, FiUsers, FiHome, FiSettings, FiPlusSquare, FiClipboard, FiTarget, FiChevronLeft } from 'react-icons/fi'
import { getSession } from '@/lib/authSession'

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<string>('master_admin')

  // Persist collapsed state & get user role
  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed')
    if (saved) setCollapsed(saved === '1')
    
    // Get user role from session
    const session = getSession()
    if (session?.role) setUserRole(session.role)
  }, [])
  
  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('admin_sidebar_collapsed', next ? '1' : '0') } catch {}
  }
  
  // Define navigation based on role
  const allLinks = [
    { href: '/admin', label: 'Dashboard', icon: <FiGrid />, roles: ['master_admin', 'admin'] },
    { href: '/admin/properties', label: userRole === 'agent' ? 'My Properties' : userRole === 'broker' ? 'Team Properties' : 'Properties', icon: <FiHome />, roles: ['master_admin', 'admin', 'agent', 'broker'] },
    { href: '/admin/people', label: 'People', icon: <FiUsers />, roles: ['master_admin', 'admin', 'broker'] },
    { href: '/admin/leads', label: userRole === 'agent' ? 'My Leads' : 'Leads', icon: <FiTarget />, roles: ['master_admin', 'admin', 'agent', 'broker'] },
    { href: '/admin/applications', label: 'Applications', icon: <FiClipboard />, roles: ['master_admin', 'admin'] },
    { href: '/admin/settings', label: 'Settings', icon: <FiSettings />, roles: ['master_admin'] },
  ]
  
  // Filter links based on user role
  const links = allLinks.filter(link => link.roles.includes(userRole))

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 min-h-screen p-3 transition-all duration-300 shadow-lg`}>
      <div className="flex items-center justify-between mb-4 px-2">
        {!collapsed && <div className="text-sm font-bold text-[#0B2545] tracking-wide">ADMIN PORTAL</div>}
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
          <div className="text-xs font-bold text-blue-900 mb-2 tracking-wide">QUICK ACTIONS</div>
          <div className="space-y-2">
            {['master_admin', 'admin', 'agent', 'broker'].includes(userRole) && (
              <Link href="/admin/properties/create" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
                <FiPlusSquare className="text-blue-600" /> <span>Create Property</span>
              </Link>
            )}
            {['master_admin', 'admin', 'broker'].includes(userRole) && (
              <Link href="/admin/people" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
                <FiUsers className="text-blue-600" /> <span>Manage {userRole === 'broker' ? 'Team' : 'People'}</span>
              </Link>
            )}
            {['master_admin', 'admin', 'agent', 'broker'].includes(userRole) && (
              <Link href="/admin/leads" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
                <FiTarget className="text-blue-600" /> <span>Manage Leads</span>
              </Link>
            )}
            <Link href="/" className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150 flex items-center gap-2">
              <span>🌐</span> View Public Site
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
