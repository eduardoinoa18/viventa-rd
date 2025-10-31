// components/AdminSidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiGrid, FiUsers, FiHome, FiSettings, FiUserCheck, FiBriefcase, FiMessageSquare, FiPlusSquare, FiClipboard, FiCreditCard, FiShield, FiActivity, FiTarget, FiBarChart2 } from 'react-icons/fi'

export default function AdminSidebar() {
  const pathname = usePathname()
  
  const links = [
    { href: '/admin', label: 'Dashboard', icon: <FiGrid /> },
    { href: '/admin/diagnostics', label: 'System Status', icon: <FiSettings />, highlight: true },
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
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <nav className="space-y-2">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              pathname === link.href
                ? 'bg-[#00A676] text-white font-semibold'
                : (link as any).highlight
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-xl">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="mt-8 p-3 bg-blue-50 rounded-lg">
        <div className="text-xs font-semibold text-blue-900 mb-1">Quick Actions</div>
        <Link href="/" className="text-sm text-blue-600 hover:underline block">View Public Site</Link>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline block mt-1">User Dashboard</Link>
      </div>
    </aside>
  )
}
