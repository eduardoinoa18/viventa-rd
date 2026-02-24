'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiGrid, FiUsers, FiHome, FiBarChart2, FiClipboard, FiTarget, FiInbox } from 'react-icons/fi'

const navigation = [
  { href: '/master', label: 'Overview', icon: FiGrid },
  { href: '/master/listings', label: 'Listings', icon: FiHome },
  { href: '/master/applications', label: 'Applications', icon: FiClipboard },
  { href: '/master/leads', label: 'Leads', icon: FiTarget },
  { href: '/master/inbox', label: 'Inbox', icon: FiInbox },
  { href: '/master/users', label: 'Users', icon: FiUsers },
  { href: '/master/analytics', label: 'Analytics', icon: FiBarChart2 },
]

export default function MasterSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/master') {
      return pathname === '/master'
    }
    return pathname?.startsWith(href)
  }

  return (
    <aside className="w-64 bg-[#0B2545] text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold">VIVENTA</h1>
        <p className="text-sm text-white/60 mt-1">Master Control</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${
                      active
                        ? 'bg-[#FF6B35] text-white font-semibold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Link
          href="/search"
          className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          ← Back to Site
        </Link>
      </div>
    </aside>
  )
}
