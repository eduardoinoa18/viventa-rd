'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '@/app/auth/ProtectedClient'
import { FiTrendingUp, FiAward, FiStar, FiZap, FiTarget, FiUsers } from 'react-icons/fi'
import { getSession } from '@/lib/authSession'

interface AgentStats {
  id: string
  name: string
  email: string
  points: number
  level: number
  rank: number
  badges: string[]
  achievements: Achievement[]
  stats: {
    listingsCreated: number
    listingsSold: number
    leadsGenerated: number
    leadsConverted: number
    revenue: number
  }
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: Date
  points: number
}

interface LeaderboardEntry {
  id: string
  name: string
  avatar?: string
  points: number
  level: number
  rank: number
  trend: 'up' | 'down' | 'same'
}

export default function GamificationDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'achievements'>('overview')
  const [myStats, setMyStats] = useState<AgentStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGamificationData()
  }, [])

  async function fetchGamificationData() {
    try {
      const session = await getSession()
      if (!session?.uid) return

      // Fetch user stats
      const statsRes = await fetch(`/api/gamification/stats?userId=${session.uid}`)
      const statsData = await statsRes.json()
      if (statsData.ok) setMyStats(statsData.stats)

      // Fetch leaderboard
      const leaderboardRes = await fetch('/api/gamification/leaderboard')
      const leaderboardData = await leaderboardRes.json()
      if (leaderboardData.ok) setLeaderboard(leaderboardData.leaderboard)

      setLoading(false)
    } catch (error) {
      console.error('Error fetching gamification data:', error)
      setLoading(false)
    }
  }

  const getLevelProgress = (points: number) => {
    const pointsPerLevel = 1000
    const currentLevelPoints = points % pointsPerLevel
    const progress = (currentLevelPoints / pointsPerLevel) * 100
    return progress
  }

  const getNextLevelPoints = (points: number) => {
    const pointsPerLevel = 1000
    const currentLevelPoints = points % pointsPerLevel
    return pointsPerLevel - currentLevelPoints
  }

  if (loading) {
    return (
      <ProtectedClient allowed={['agent', 'broker']}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
          <div className="animate-pulse text-2xl font-bold text-[#004AAD]">Cargando...</div>
        </div>
      </ProtectedClient>
    )
  }

  return (
    <ProtectedClient allowed={['agent', 'broker']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#004AAD] to-[#00A6A6] text-white py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">🏆 Centro de Rendimiento</h1>
            <p className="text-blue-100">Compite, crece y alcanza tus metas</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-6">
          {/* My Stats Card */}
          {myStats && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 animate-fade-in-up">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold animate-pulse-slow">
                    {myStats.level}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{myStats.name}</h2>
                    <p className="text-gray-600">Nivel {myStats.level} · Ranking #{myStats.rank}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#00A676]">{myStats.points.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Puntos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{myStats.badges.length}</div>
                    <div className="text-sm text-gray-600">Insignias</div>
                  </div>
                </div>
              </div>

              {/* Level Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progreso al Nivel {myStats.level + 1}</span>
                  <span>{getNextLevelPoints(myStats.points)} puntos restantes</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00A676] to-[#00A6A6] transition-all duration-1000 ease-out"
                    style={{ width: `${getLevelProgress(myStats.points)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 flex gap-2 bg-white rounded-xl p-2 shadow">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#00A676] text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiTrendingUp className="inline mr-2" />
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-[#00A676] text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiUsers className="inline mr-2" />
              Tabla de Líderes
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'achievements'
                  ? 'bg-[#00A676] text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiAward className="inline mr-2" />
              Logros
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && myStats && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
              <StatCard
                icon={<FiTarget className="text-3xl" />}
                label="Propiedades Publicadas"
                value={myStats.stats.listingsCreated}
                color="blue"
                points={myStats.stats.listingsCreated * 50}
              />
              <StatCard
                icon={<FiZap className="text-3xl" />}
                label="Propiedades Vendidas"
                value={myStats.stats.listingsSold}
                color="green"
                points={myStats.stats.listingsSold * 500}
              />
              <StatCard
                icon={<FiStar className="text-3xl" />}
                label="Leads Generados"
                value={myStats.stats.leadsGenerated}
                color="yellow"
                points={myStats.stats.leadsGenerated * 10}
              />
              <StatCard
                icon={<FiAward className="text-3xl" />}
                label="Leads Convertidos"
                value={myStats.stats.leadsConverted}
                color="purple"
                points={myStats.stats.leadsConverted * 100}
              />
              <StatCard
                icon={<FiTrendingUp className="text-3xl" />}
                label="Revenue Total"
                value={`$${myStats.stats.revenue.toLocaleString()}`}
                color="teal"
                points={Math.floor(myStats.stats.revenue / 1000)}
              />
              <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all">
                <FiStar className="text-4xl mb-3" />
                <div className="text-2xl font-bold mb-1">Nivel {myStats.level}</div>
                <div className="text-sm opacity-90">Agente {myStats.level >= 5 ? 'Elite' : 'en Crecimiento'}</div>
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
              <div className="p-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FiAward className="text-3xl" />
                  Top 100 Agentes
                </h2>
                <p className="opacity-90 mt-1">Los mejores de este mes</p>
              </div>
              
              <div className="divide-y">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`p-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                        index === 0 ? 'bg-yellow-400 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${entry.rank}`}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{entry.name}</div>
                        <div className="text-sm text-gray-600">Nivel {entry.level}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#00A676]">
                        {entry.points.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">puntos</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && myStats && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
              {myStats.badges.map((badge, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <div className="text-5xl mb-3">{getBadgeEmoji(badge)}</div>
                  <h3 className="font-bold text-lg mb-2">{badge}</h3>
                  <p className="text-sm text-gray-600">Desbloqueado</p>
                </div>
              ))}
              
              {/* Locked Achievements */}
              <div className="bg-gray-100 rounded-2xl p-6 opacity-60">
                <div className="text-5xl mb-3 filter grayscale">🏆</div>
                <h3 className="font-bold text-lg mb-2">Vendedor del Mes</h3>
                <p className="text-sm text-gray-600">Bloqueado · Vende 10 propiedades</p>
              </div>
              <div className="bg-gray-100 rounded-2xl p-6 opacity-60">
                <div className="text-5xl mb-3 filter grayscale">💎</div>
                <h3 className="font-bold text-lg mb-2">Élite Diamond</h3>
                <p className="text-sm text-gray-600">Bloqueado · Alcanza nivel 20</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedClient>
  )
}

function StatCard({ icon, label, value, color, points }: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
  points: number
}) {
  const colorClasses = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    yellow: 'from-yellow-400 to-yellow-600',
    purple: 'from-purple-400 to-purple-600',
    teal: 'from-teal-400 to-teal-600',
  }[color]

  return (
    <div className={`bg-gradient-to-br ${colorClasses} rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all`}>
      <div className="mb-3">{icon}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90 mb-3">{label}</div>
      <div className="text-xs bg-white/20 rounded-full px-3 py-1 inline-block">
        +{points} puntos
      </div>
    </div>
  )
}

function getBadgeEmoji(badge: string): string {
  const badges: Record<string, string> = {
    'Primera Venta': '🎯',
    'Agente Estrella': '⭐',
    'Lead Master': '🔥',
    'Top 10': '🏅',
    'Vendedor Mensual': '👑',
    'Cliente Feliz': '😊',
    'Madrugador': '🌅',
  }
  return badges[badge] || '🏆'
}
