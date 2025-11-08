'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/authSession'
import ProfessionalSidebar from '@/components/ProfessionalSidebar'
import { FiActivity, FiUsers, FiEye, FiPhone, FiTrendingUp } from 'react-icons/fi'

export default function AgentAnalyticsPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'agent') {
      router.replace('/agent/login')
      return
    }
    setUser(s)
  }, [])

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ProfessionalSidebar role="agent" userName={user.name} professionalCode={user.professionalCode || user.agentCode} />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0B2545] mb-2">Analytics</h1>
            <p className="text-gray-600">Métricas de rendimiento de tus listados y embudo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2"><span className="text-gray-500">Vistas</span><FiEye /></div>
              <div className="text-3xl font-bold">2,345</div>
              <div className="text-sm text-green-600 mt-1 inline-flex items-center gap-1"><FiTrendingUp /> +12% vs semana pasada</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2"><span className="text-gray-500">Contactos</span><FiPhone /></div>
              <div className="text-3xl font-bold">178</div>
              <div className="text-sm text-green-600 mt-1 inline-flex items-center gap-1"><FiTrendingUp /> +8%</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2"><span className="text-gray-500">Leads</span><FiUsers /></div>
              <div className="text-3xl font-bold">62</div>
              <div className="text-sm text-green-600 mt-1 inline-flex items-center gap-1"><FiTrendingUp /> +5%</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2"><span className="text-gray-500">Índice de Conversión</span><FiActivity /></div>
              <div className="text-3xl font-bold">3.8%</div>
              <div className="text-sm text-green-600 mt-1 inline-flex items-center gap-1"><FiTrendingUp /> +0.4 ptos</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Rendimiento por listado</h2>
            <div className="text-gray-500 text-sm">Gráficas y tabla detallada próximamente</div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Embudo de ventas</h2>
            <div className="text-gray-500 text-sm">Funnel de etapas: vistas → contactos → leads → citas → cierre</div>
          </div>
        </div>
      </main>
    </div>
  )
}
