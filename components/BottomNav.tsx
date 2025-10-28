'use client'
import { usePathname, useRouter } from 'next/navigation'
import { FiHome, FiSearch, FiHeart, FiMessageCircle, FiUser, FiStar } from 'react-icons/fi'
import { useEffect, useState } from 'react'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't show on admin pages or special pages
  if (!mounted || pathname?.startsWith('/admin') || pathname?.startsWith('/onboarding')) {
    return null
  }

  const navItems = [
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
      active: pathname?.startsWith('/social')
    },
    {
      name: 'Favoritos',
      icon: FiHeart,
      path: '/favorites',
      active: pathname === '/favorites'
    },
    {
      name: 'Mensajes',
      icon: FiMessageCircle,
      path: '/dashboard',
      active: pathname?.startsWith('/dashboard') && pathname !== '/'
    },
    {
      name: 'Perfil',
      icon: FiUser,
      path: '/dashboard',
      active: false // Will show active state differently
    }
  ]

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 md:hidden" />
      
      {/* Bottom Navigation - Only visible on mobile */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[640px] bg-white/95 border-t border-gray-200 shadow-2xl md:hidden z-50 pb-[env(safe-area-inset-bottom)] rounded-t-2xl backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.active
            
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 active:scale-95 ${
                  isActive 
                    ? 'text-[#00A676]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isActive ? 'bg-gradient-to-br from-[#00A6A6] to-[#004AAD] text-white shadow-lg' : 'bg-gray-100 text-gray-600'}`}>
                    <Icon className="text-xl" />
                  </div>
                </div>
                {item.name === 'Social' && (
                  <span className="absolute -top-1 right-4 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Soon</span>
                )}
                <span className={`text-[11px] font-medium ${isActive ? 'text-[#0B2545]' : ''}`}>{item.name}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
