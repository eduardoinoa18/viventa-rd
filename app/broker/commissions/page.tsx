'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/authSession'
import ProfessionalSidebar from '@/components/ProfessionalSidebar'
import { FiDollarSign, FiUser, FiPercent } from 'react-icons/fi'

export default function BrokerCommissionsPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'broker') { router.replace('/broker/login'); return }
    setUser(s)
  }, [])

  if (!user) return null

  const payouts = [
    { id: 'p1', agent: 'Laura Castillo', listing: 'Apartamento Piantini', amount: 240000, split: 70, date: '2025-10-15' },
    { id: 'p2', agent: 'Miguel Rivera', listing: 'Villa Casa de Campo', amount: 520000, split: 65, date: '2025-10-12' },
    { id: 'p3', agent: 'Sofía Gómez', listing: 'Local Comercial Naco', amount: 180000, split: 70, date: '2025-10-05' },
  ]

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <ProfessionalSidebar role='broker' userName={user.name} professionalCode={user.professionalCode || user.brokerCode} />
      <main className='flex-1 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-[#0B2545] mb-2'>Comisiones</h1>
            <p className='text-gray-600'>Revisión de pagos y splits por agente</p>
          </div>

          <div className='grid md:grid-cols-3 gap-6 mb-6'>
            <div className='bg-white rounded-xl shadow p-6'>
              <div className='text-gray-500 text-sm'>Total a Pagar</div>
              <div className='text-3xl font-bold text-[#0B2545]'>RD$ {(payouts.reduce((s,p)=>s+p.amount,0)).toLocaleString('es-DO')}</div>
            </div>
            <div className='bg-white rounded-xl shadow p-6'>
              <div className='text-gray-500 text-sm'>Promedio Split</div>
              <div className='text-3xl font-bold text-[#0B2545]'>
                {Math.round(payouts.reduce((s,p)=>s+p.split,0)/payouts.length)}%
              </div>
            </div>
            <div className='bg-white rounded-xl shadow p-6'>
              <div className='text-gray-500 text-sm'>Pagos Pendientes</div>
              <div className='text-3xl font-bold text-[#0B2545]'>2</div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b'>
                <tr>
                  <th className='text-left p-4 font-semibold text-gray-700'>Agente</th>
                  <th className='text-left p-4 font-semibold text-gray-700'>Listado</th>
                  <th className='text-left p-4 font-semibold text-gray-700'>Split</th>
                  <th className='text-left p-4 font-semibold text-gray-700'>Monto</th>
                  <th className='text-left p-4 font-semibold text-gray-700'>Fecha</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {payouts.map(p => (
                  <tr key={p.id} className='hover:bg-gray-50'>
                    <td className='p-4 text-gray-800 font-medium flex items-center gap-2'><FiUser /> {p.agent}</td>
                    <td className='p-4 text-gray-600'>{p.listing}</td>
                    <td className='p-4 text-gray-700 flex items-center gap-1'><FiPercent /> {p.split}%</td>
                    <td className='p-4 font-semibold text-[#0B2545]'>RD$ {p.amount.toLocaleString('es-DO')}</td>
                    <td className='p-4 text-gray-600'>{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
