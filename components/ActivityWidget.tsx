'use client'

import { useEffect, useState } from 'react'
import { FiActivity, FiArrowRight } from 'react-icons/fi'
import Link from 'next/link'

interface ActivityLog {
  id: string
  type: string
  action: string
  timestamp: Date
  userName?: string
  userEmail?: string
}

interface ActivityStats {
  total: number
  byType: Record<string, number>
  recentLogs: ActivityLog[]
}

export default function ActivityWidget() {
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/activity?limit=5')
      if (res.ok) {
        const response = await res.json()
        
        // API returns { ok: true, data: [...] }
        const logs = response.data || response.logs || []
        
        // Defensive check: ensure logs array exists
        if (!Array.isArray(logs)) {
          console.warn('Activity stats data is invalid or missing logs array', response)
          setStats({
            total: 0,
            byType: {},
            recentLogs: []
          })
          return
        }
        
        // Calculate stats
        const byType: Record<string, number> = {}
        logs.forEach((log: any) => {
          byType[log.type] = (byType[log.type] || 0) + 1
        })

        setStats({
          total: logs.length,
          byType,
          recentLogs: logs.map((log: any) => ({
            id: log.id,
            type: log.type,
            action: log.action,
            timestamp: new Date(log.timestamp),
            userName: log.userName,
            userEmail: log.userEmail
          }))
        })
      }
    } catch (error) {
      console.error('Failed to load activity stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      user: 'bg-blue-100 text-blue-800',
      application: 'bg-green-100 text-green-800',
      property: 'bg-purple-100 text-purple-800',
      auth: 'bg-orange-100 text-orange-800',
      admin: 'bg-red-100 text-red-800',
      system: 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div>
      {/* Header */}
      <div className="pb-4 flex items-center justify-between">
        <div className="text-gray-600 text-sm">
          Showing {stats.total} recent events
        </div>
        <Link 
          href="/admin/activity"
          className="text-sm text-[#00A676] hover:text-[#008F64] font-semibold inline-flex items-center gap-1 transition-colors"
        >
          View All Activity <FiArrowRight />
        </Link>
      </div>

      {/* Activity Types Summary */}
      <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byType).map(([type, count]) => (
            <span
              key={type}
              className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getTypeColor(type)}`}
            >
              {type}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="space-y-2">
        {stats.recentLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No recent activity
          </div>
        ) : (
          stats.recentLogs.map((log) => (
            <div key={log.id} className="p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200 hover:shadow-md hover:border-[#00A676] transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getTypeColor(log.type)}`}>
                      {log.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getRelativeTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {log.action}
                  </p>
                  {log.userName && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      by {log.userName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
