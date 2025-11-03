'use client'
import { usePathname, useRouter } from 'next/navigation'
import { FiHome, FiSearch, FiHeart, FiMessageCircle, FiUser, FiStar, FiLogIn } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/authSession'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    setSession(getSession())
  }, [])

  // Don't show on admin pages, special pages, or auth pages
  if (!mounted || pathname?.startsWith('/admin') || pathname?.startsWith('/onboarding') || pathname === '/login' || pathname === '/signup') {
    return null
  }

  // Build nav items based on auth state
  const adminHome = session?.role === 'master_admin' ? '/admin'
    : session?.role === 'admin' ? '/admin'
    : session?.role === 'broker' ? '/broker'
    : session?.role === 'agent' ? '/agent'
    : '/dashboard'

  const navItems = session ? [
    {
      name: 'Inicio',
      icon: FiHome,
      path: '/',
      active: pathname === '/'
    },
    {
      name: 'Buscar',
      icon: FiSearch,
      path: '/search',
      active: pathname?.startsWith('/search')
    },
    {
      name: 'Social',
      icon: FiStar,
      path: '/social',
      active: pathname?.startsWith('/social'),
      comingSoon: true
    },
    {
      name: 'Favoritos',
      icon: FiHeart,
      path: '/favorites',
      active: pathname?.startsWith('/favorites')
    },
    {
      name: (session.role === 'master_admin' || session.role === 'admin') ? 'Admin' : 'Perfil',
      icon: FiUser,
      path: adminHome,
      active: pathname?.startsWith(adminHome)
    }
  ] : [
    {
      name: 'Inicio',
      icon: FiHome,
      path: '/',
      active: pathname === '/'
    },
    {
      name: 'Buscar',
      icon: FiSearch,
      path: '/search',
      active: pathname?.startsWith('/search')
    },
    {
      name: 'Social',
      icon: FiStar,
      path: '/social',
      active: pathname?.startsWith('/social'),
      comingSoon: true
    },
    {
      name: 'Agentes',
      icon: FiUser,
      path: '/agents',
      active: pathname?.startsWith('/agents')
    },
    {
      name: 'Login',
      icon: FiLogIn,
      path: '/login',
      active: pathname === '/login',
      highlight: true
    }
  ]

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 md:hidden" />
      
      {/* Bottom Navigation - Only visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-gradient-to-t from-white via-white to-white/95 border-t border-viventa-turquoise/20 shadow-2xl md:hidden z-50 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
        <div className="flex items-center justify-around h-16 px-1 max-w-[640px] mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.active
            const isHighlight = 'highlight' in item && item.highlight
            const isComingSoon = 'comingSoon' in item && item.comingSoon
            
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                aria-label={item.name}
                disabled={isComingSoon}
                className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 active:scale-95 min-w-[60px] ${
                  isActive 
                    ? 'text-viventa-turquoise' 
                    : isHighlight
                    ? 'text-viventa-teal'
                    : isComingSoon
                    ? 'text-gray-400 opacity-60'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {isComingSoon && (
                  <span className="absolute -top-1 right-1/4 bg-viventa-sunset text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                    Pronto
                  </span>
                )}
                <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isActive 
                      ? 'bg-gradient-to-br from-viventa-turquoise to-viventa-ocean text-white shadow-lg' 
                      : isHighlight
                      ? 'bg-gradient-to-br from-viventa-teal to-viventa-turquoise text-white shadow-md'
                      : isComingSoon
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-viventa-sand text-viventa-ocean'
                  }`}>
                    <Icon className="text-xl" />
                  </div>
                </div>
                <span className={`text-[11px] font-medium ${isActive ? 'text-viventa-navy' : isHighlight ? 'text-viventa-teal' : ''}`}>
                  {item.name}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
