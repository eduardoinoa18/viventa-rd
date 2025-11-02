'use client'
import { FiStar, FiSearch, FiHeart, FiEye, FiAward, FiTrendingUp } from 'react-icons/fi'
import { useState, useEffect } from 'react'

interface UserStats {
  propertiesViewed: number
  searchesMade: number
  favoritesSaved: number
  level: number
  points: number
  nextLevelPoints: number
}

interface Badge {
  id: string
  name: string
  description: string
  icon: any
  unlocked: boolean
  progress?: number
  target?: number
}

export default function UserEngagement() {
  const [stats, setStats] = useState<UserStats>({
    propertiesViewed: 0,
    searchesMade: 0,
    favoritesSaved: 0,
    level: 1,
    points: 0,
    nextLevelPoints: 100
  })

  const [badges, setBadges] = useState<Badge[]>([
    {
      id: 'first_search',
      name: 'Explorador',
      description: 'Realizaste tu primera búsqueda',
      icon: FiSearch,
      unlocked: false,
      progress: 0,
      target: 1
    },
    {
      id: 'five_views',
      name: 'Observador',
      description: 'Viste 5 propiedades',
      icon: FiEye,
      unlocked: false,
      progress: 0,
      target: 5
    },
    {
      id: 'first_favorite',
      name: 'Coleccionista',
      description: 'Guardaste tu primera propiedad favorita',
      icon: FiHeart,
      unlocked: false,
      progress: 0,
      target: 1
    },
    {
      id: 'ten_searches',
      name: 'Buscador Activo',
      description: 'Realizaste 10 búsquedas',
      icon: FiTrendingUp,
      unlocked: false,
      progress: 0,
      target: 10
    },
    {
      id: 'five_favorites',
      name: 'Curador',
      description: 'Guardaste 5 propiedades favoritas',
      icon: FiAward,
      unlocked: false,
      progress: 0,
      target: 5
    }
  ])

  useEffect(() => {
    loadUserStats()
  }, [])

  async function loadUserStats() {
    try {
      const res = await fetch('/api/user/stats')
      const data = await res.json()
      if (data.ok) {
        setStats(data.stats)
        updateBadges(data.stats)
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  function updateBadges(userStats: UserStats) {
    setBadges(prev => prev.map(badge => {
      let progress = 0
      let unlocked = false

      switch (badge.id) {
        case 'first_search':
          progress = userStats.searchesMade
          unlocked = userStats.searchesMade >= 1
          break
        case 'five_views':
          progress = userStats.propertiesViewed
          unlocked = userStats.propertiesViewed >= 5
          break
        case 'first_favorite':
          progress = userStats.favoritesSaved
          unlocked = userStats.favoritesSaved >= 1
          break
        case 'ten_searches':
          progress = userStats.searchesMade
          unlocked = userStats.searchesMade >= 10
          break
        case 'five_favorites':
          progress = userStats.favoritesSaved
          unlocked = userStats.favoritesSaved >= 5
          break
      }

      return { ...badge, progress, unlocked }
    }))
  }

  const progressPercentage = (stats.points / stats.nextLevelPoints) * 100

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-2xl font-bold">Nivel {stats.level}</h3>
            <p className="text-sm opacity-90">¡Sigue explorando propiedades!</p>
          </div>
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <FiStar className="text-3xl" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{stats.points} puntos</span>
            <span>{stats.nextLevelPoints} para siguiente nivel</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 text-center shadow hover:shadow-lg transition-shadow">
          <FiEye className="text-3xl mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold text-gray-800">{stats.propertiesViewed}</div>
          <div className="text-xs text-gray-500">Propiedades vistas</div>
        </div>

        <div className="bg-white rounded-xl p-4 text-center shadow hover:shadow-lg transition-shadow">
          <FiSearch className="text-3xl mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-gray-800">{stats.searchesMade}</div>
          <div className="text-xs text-gray-500">Búsquedas</div>
        </div>

        <div className="bg-white rounded-xl p-4 text-center shadow hover:shadow-lg transition-shadow">
          <FiHeart className="text-3xl mx-auto mb-2 text-red-600" />
          <div className="text-2xl font-bold text-gray-800">{stats.favoritesSaved}</div>
          <div className="text-xs text-gray-500">Favoritos</div>
        </div>
      </div>

      {/* Badges/Achievements */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiAward className="text-yellow-600" />
          Logros
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const Icon = badge.icon
            return (
              <div 
                key={badge.id}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  badge.unlocked 
                    ? 'border-yellow-400 bg-yellow-50' 
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <Icon className={`text-3xl mx-auto mb-2 ${
                  badge.unlocked ? 'text-yellow-600' : 'text-gray-400'
                }`} />
                <div className="font-semibold text-sm mb-1">{badge.name}</div>
                <div className="text-xs text-gray-500 mb-2">{badge.description}</div>
                
                {!badge.unlocked && badge.progress !== undefined && badge.target && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${(badge.progress / badge.target) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {badge.progress}/{badge.target}
                    </div>
                  </div>
                )}

                {badge.unlocked && (
                  <div className="text-xs font-semibold text-yellow-600 mt-1">
                    ✓ Desbloqueado
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {badges.filter(b => b.unlocked).length === 0 && (
          <p className="text-center text-gray-500 mt-4 text-sm">
            Explora propiedades para desbloquear tus primeros logros 🎯
          </p>
        )}
      </div>
    </div>
  )
}
