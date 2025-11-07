// components/AdminPeopleTabs.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiUsers, FiUserCheck, FiBriefcase, FiTarget, FiFileText } from 'react-icons/fi'

export default function AdminPeopleTabs() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Users', href: '/admin/people', icon: FiUsers, exact: true },
    { name: 'Agents', href: '/admin/people/agents', icon: FiUserCheck },
    { name: 'Brokers', href: '/admin/people/brokers', icon: FiBriefcase },
    { name: 'Leads', href: '/admin/people/leads', icon: FiTarget },
    { name: 'Applications', href: '/admin/people/applications', icon: FiFileText },
  ]

  function isActive(tab: typeof tabs[0]) {
    if (tab.exact) {
      return pathname === tab.href
    }
    return pathname?.startsWith(tab.href)
  }

  return (
    <div className="border-b border-gray-200 bg-white sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex space-x-8 -mb-px" aria-label="People tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab)
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${active
                    ? 'border-[#00A676] text-[#00A676]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-[#00A676]' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
