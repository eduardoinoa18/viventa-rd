// components/AdminSidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiGrid, FiUsers, FiHome, FiSettings, FiUserCheck, FiBriefcase, FiMessageSquare, FiPlusSquare, FiClipboard, FiCreditCard, FiShield, FiActivity, FiTarget, FiBarChart2, FiChevronLeft } from 'react-icons/fi'

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed')
    if (saved) setCollapsed(saved === '1')
  }, [])
  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('admin_sidebar_collapsed', next ? '1' : '0') } catch {}
  }
  
  const links = [
    { href: '/admin', label: 'Dashboard', icon: <FiGrid /> },
    { href: '/admin/activity', label: 'Activity Feed', icon: <FiActivity /> },
    { href: '/admin/analytics', label: 'Analytics & AI', icon: <FiBarChart2 /> },
    { href: '/admin/leads', label: 'Leads', icon: <FiTarget /> },
    { href: '/admin/users', label: 'Users', icon: <FiUsers /> },
    { href: '/admin/brokers', label: 'Brokers', icon: <FiBriefcase /> },
    { href: '/admin/agents', label: 'Agents', icon: <FiUserCheck /> },
    { href: '/admin/applications', label: 'Applications', icon: <FiClipboard /> },
    { href: '/admin/properties', label: 'Listings', icon: <FiHome /> },
    { href: '/admin/properties/create', label: 'Create Listing', icon: <FiPlusSquare /> },
    { href: '/admin/billing', label: 'Billing', icon: <FiCreditCard /> },
    { href: '/admin/roles', label: 'Roles & Access', icon: <FiShield /> },
    { href: '/admin/chat', label: 'Chat', icon: <FiMessageSquare /> },
    { href: '/admin/settings', label: 'Settings', icon: <FiSettings /> },
  ]

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r min-h-screen p-2 transition-all duration-200`}>
      <div className="flex items-center justify-between mb-2 px-2">
        {!collapsed && <div className="text-sm font-semibold text-gray-700">Admin</div>}
        <button onClick={toggleCollapsed} className="p-2 rounded hover:bg-gray-100 text-gray-600" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <FiChevronLeft className={`${collapsed ? 'rotate-180' : ''} transition-transform`} />
        </button>
      </div>
      <nav className="space-y-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              pathname === link.href
                ? 'bg-[#00A676] text-white font-semibold'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-xl shrink-0">{link.icon}</span>
            {!collapsed && <span className="truncate">{link.label}</span>}
          </Link>
        ))}
      </nav>
      {!collapsed && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs font-semibold text-blue-900 mb-1">Quick Actions</div>
          <Link href="/" className="text-sm text-blue-600 hover:underline block">View Public Site</Link>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline block mt-1">User Dashboard</Link>
        </div>
      )}
    </aside>
  )
}
