'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/authSession'
import ProfessionalSidebar from '@/components/ProfessionalSidebar'
import { FiBarChart2, FiTrendingUp, FiUsers, FiHome, FiDollarSign } from 'react-icons/fi'

export default function BrokerAnalyticsPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'broker') { router.replace('/broker/login'); return }
    setUser(s)
  }, [])

  if (!user) return null

  const metrics = [
    { label: 'Ingresos YTD', value: 'RD$ 42M', icon: <FiDollarSign />, trend: '+12%', color: 'from-yellow-500 to-yellow-600' },
    { label: 'Agentes Activos', value: '18', icon: <FiUsers />, trend: '+2', color: 'from-blue-500 to-blue-600' },
    { label: 'Listados Activos', value: '54', icon: <FiHome />, trend: '+8', color: 'from-green-500 to-green-600' },
    { label: 'Tasa Cierre', value: '28%', icon: <FiTrendingUp />, trend: '+4%', color: 'from-purple-500 to-purple-600' },
  ]

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <ProfessionalSidebar role='broker' userName={user.name} professionalCode={user.professionalCode || user.brokerCode} />
      <main className='flex-1 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-[#0B2545] mb-2'>Analytics del Brokerage</h1>
            <p className='text-gray-600'>Resumen de desempeño y métricas clave</p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10'>
            {metrics.map(m => (
              <div key={m.label} className={`bg-gradient-to-br ${m.color} rounded-xl shadow-lg p-6 text-white relative overflow-hidden`}>
                <div className='flex items-center justify-between mb-4'>
                  <span className='text-3xl opacity-70'>{m.icon}</span>
                  <span className='px-2 py-1 bg-white/20 rounded-full text-xs font-semibold'>{m.trend}</span>
                </div>
                <div className='text-3xl font-bold mb-1'>{m.value}</div>
                <div className='text-sm text-white/80'>{m.label}</div>
              </div>
            ))}
          </div>

          <div className='grid md:grid-cols-2 gap-6'>
            <div className='bg-white rounded-xl shadow p-6'>
              <h2 className='text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2'><FiBarChart2 /> Rendimiento Mensual</h2>
              <div className='h-48 flex items-center justify-center text-gray-400 text-sm'>Gráfico de ingresos mensuales (próximamente)</div>
            </div>
            <div className='bg-white rounded-xl shadow p-6'>
              <h2 className='text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2'><FiTrendingUp /> Embudo de Ventas</h2>
              <div className='space-y-3'>
                {[
                  { stage: 'Prospectos', count: 420 },
                  { stage: 'Contactados', count: 310 },
                  { stage: 'Calificados', count: 180 },
                  { stage: 'Cierres', count: 52 },
                ].map(s => {
                  const pct = (s.count / 420) * 100
                  let widthClass = 'w-1/12'
                  if (pct > 80) widthClass = 'w-5/6'
                  else if (pct > 60) widthClass = 'w-3/5'
                  else if (pct > 40) widthClass = 'w-2/5'
                  else if (pct > 20) widthClass = 'w-1/5'
                  return (
                    <div key={s.stage} className='flex items-center gap-3'>
                      <div className='w-32 text-sm text-gray-600'>{s.stage}</div>
                      <div className='flex-1 h-4 rounded bg-gray-100 overflow-hidden'>
                        <div
                          className={`h-full bg-gradient-to-r from-[#00A676] to-[#008F64] transition-all duration-500 ${widthClass}`}
                          data-count={s.count}
                          aria-label={`Progreso ${s.stage}`}
                        ></div>
                      </div>
                      <div className='w-12 text-right text-sm font-semibold text-gray-700'>{s.count}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className='mt-10 bg-white rounded-xl shadow p-6'>
            <h2 className='text-lg font-semibold text-gray-800 mb-4'>Insight Rápidos</h2>
            <ul className='space-y-2 text-sm text-gray-600'>
              <li>• Los listados de lujo muestran +18% más vistas este mes.</li>
              <li>• Agentes nuevos cierran su primer negocio en ~34 días promedio.</li>
              <li>• Necesidad de aumentar seguimiento en etapa de calificación (alta caída).</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
