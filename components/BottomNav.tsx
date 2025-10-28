'use client'
import { usePathname, useRouter } from 'next/navigation'
import { FiHome, FiSearch, FiHeart, FiMessageCircle, FiUser } from 'react-icons/fi'
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.active
            
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 active:scale-95 ${
                  isActive 
                    ? 'text-[#00A676]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className={`relative transition-transform ${isActive ? 'scale-110' : ''}`}>
                  <Icon className="text-2xl" />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#00A676] rounded-full animate-pulse" />
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
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
