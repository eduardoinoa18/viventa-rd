'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/authSession'
import ProfessionalSidebar from '@/components/ProfessionalSidebar'
import { FiClipboard, FiDownload } from 'react-icons/fi'

export default function BrokerReportsPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'broker') { router.replace('/broker/login'); return }
    setUser(s)
  }, [])

  if (!user) return null

  const reports = [
    { id: 'r1', name: 'Resumen mensual (Oct 2025)', size: '1.2 MB' },
    { id: 'r2', name: 'Rendimiento por agente', size: '950 KB' },
    { id: 'r3', name: 'Inventario de listados', size: '730 KB' },
  ]

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <ProfessionalSidebar role='broker' userName={user.name} professionalCode={user.professionalCode || user.brokerCode} />
      <main className='flex-1 p-6'>
        <div className='max-w-5xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-[#0B2545] mb-2'>Reportes</h1>
            <p className='text-gray-600'>Descarga reportes operativos y de rendimiento</p>
          </div>

          <div className='bg-white rounded-xl shadow divide-y'>
            {reports.map(r => (
              <div key={r.id} className='flex items-center justify-between p-4'>
                <div>
                  <div className='font-semibold text-gray-800 flex items-center gap-2'><FiClipboard /> {r.name}</div>
                  <div className='text-xs text-gray-500'>{r.size}</div>
                </div>
                <button className='px-3 py-2 bg-[#0B2545] text-white rounded-lg text-sm font-semibold hover:bg-[#0a1f3a] inline-flex items-center gap-2'>
                  <FiDownload /> Descargar
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
