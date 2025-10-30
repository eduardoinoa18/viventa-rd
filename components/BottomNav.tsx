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
      name: 'Favoritos',
      icon: FiHeart,
      path: '/favorites',
      active: pathname?.startsWith('/favorites')
    },
    {
      name: 'Mensajes',
      icon: FiMessageCircle,
      path: '/messages',
      active: pathname?.startsWith('/messages')
    },
    {
      name: 'Perfil',
      icon: FiUser,
      path: '/dashboard',
      active: pathname?.startsWith('/dashboard')
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
      name: 'Agentes',
      icon: FiUser,
      path: '/agents',
      active: pathname?.startsWith('/agents')
    },
    {
      name: 'Contacto',
      icon: FiMessageCircle,
      path: '/contact',
      active: pathname?.startsWith('/contact')
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
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/98 border-t border-gray-200 shadow-2xl md:hidden z-50 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm supports-[backdrop-filter]:bg-white/95">
        <div className="flex items-center justify-around h-16 px-1 max-w-[640px] mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.active
            const isHighlight = 'highlight' in item && item.highlight
            
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                aria-label={item.name}
                className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 active:scale-95 min-w-[60px] ${
                  isActive 
                    ? 'text-[#00A676]' 
                    : isHighlight
                    ? 'text-[#00A676]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isActive 
                      ? 'bg-gradient-to-br from-[#00A6A6] to-[#004AAD] text-white shadow-lg' 
                      : isHighlight
                      ? 'bg-gradient-to-br from-[#00A676] to-[#00A6A6] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="text-xl" />
                  </div>
                </div>
                <span className={`text-[11px] font-medium ${isActive ? 'text-[#0B2545]' : isHighlight ? 'text-[#00A676]' : ''}`}>
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
