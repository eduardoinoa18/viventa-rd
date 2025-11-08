'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/authSession'
import ProfessionalSidebar from '@/components/ProfessionalSidebar'
import { FiUsers, FiSearch, FiUserPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface TeamAgent {
  id: string
  name: string
  email: string
  status: 'active' | 'pending' | 'inactive'
  listings?: number
  sold?: number
}

export default function BrokerTeamPage() {
  const [user, setUser] = useState<any>(null)
  const [agents, setAgents] = useState<TeamAgent[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'broker') { router.replace('/broker/login'); return }
    setUser(s)
    // Mock agents
    setAgents([
      { id: 'a1', name: 'Laura Castillo', email: 'laura@example.com', status: 'active', listings: 14, sold: 6 },
      { id: 'a2', name: 'Miguel Rivera', email: 'miguel@example.com', status: 'pending', listings: 0, sold: 0 },
      { id: 'a3', name: 'Sofía Gómez', email: 'sofia@example.com', status: 'active', listings: 8, sold: 3 },
      { id: 'a4', name: 'Juan Pérez', email: 'juan@example.com', status: 'inactive', listings: 2, sold: 1 },
    ])
  }, [])

  async function inviteAgent(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return
    setInviteLoading(true)
    try {
      const res = await fetch('/api/broker/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName })
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Invitación enviada exitosamente')
        setShowInvite(false)
        setInviteEmail('')
        setInviteName('')
      } else {
        toast.error(data.error || 'Error al enviar invitación')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setInviteLoading(false)
    }
  }

  if (!user) return null

  const filtered = agents.filter(a => {
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filter === 'all' || a.status === filter
    return matchesSearch && matchesStatus
  })

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <ProfessionalSidebar role='broker' userName={user.name} professionalCode={user.professionalCode || user.brokerCode} />
      <main className='flex-1 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-wrap justify-between items-center mb-8 gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-[#0B2545] mb-2'>Mi Equipo</h1>
              <p className='text-gray-600'>Gestiona agentes y su desempeño</p>
            </div>
            <button onClick={() => setShowInvite(true)} className='px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] inline-flex items-center gap-2'>
              <FiUserPlus /> Invitar Agente
            </button>
          </div>

          <div className='bg-white rounded-xl shadow p-4 mb-6 flex flex-col md:flex-row gap-4 md:items-center'>
            <div className='flex items-center gap-2 flex-1'>
              <FiSearch className='text-gray-500' />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Buscar por nombre o email' aria-label='Buscar agentes' className='flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent' />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value as any)} aria-label='Filtrar por estado' className='px-3 py-2 border rounded-lg'>
              <option value='all'>Todos</option>
              <option value='active'>Activos</option>
              <option value='pending'>Pendientes</option>
              <option value='inactive'>Inactivos</option>
            </select>
          </div>

          <div className='bg-white rounded-xl shadow overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b'>
                <tr>
                  <th className='text-left p-4 font-semibold text-gray-700'>Agente</th>
                  <th className='text-left p-4 font-semibold text-gray-700'>Email</th>
                  <th className='text-left p-4 font-semibold text-gray-700'>Estado</th>
                  <th className='text-left p-4 font-semibold text-gray-700'>Listados</th>
                  <th className='text-left p-4 font-semibold text-gray-700'>Vendidos</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className='p-8 text-center text-gray-500'>No hay agentes que coincidan</td>
                  </tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className='hover:bg-gray-50'>
                    <td className='p-4 font-semibold text-gray-800'>{a.name}</td>
                    <td className='p-4 text-gray-600'>{a.email}</td>
                    <td className='p-4'>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${a.status === 'active' ? 'bg-green-100 text-green-800' : a.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>{a.status === 'active' ? 'Activo' : a.status === 'pending' ? 'Pendiente' : 'Inactivo'}</span>
                    </td>
                    <td className='p-4 text-gray-600'>{a.listings}</td>
                    <td className='p-4 text-gray-600'>{a.sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showInvite && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
            <form onSubmit={inviteAgent} className='bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4' role='dialog' aria-modal='true' aria-label='Invitar agente'>
              <h3 className='text-lg font-bold text-[#0B2545] mb-2'>Invitar Nuevo Agente</h3>
              <input
                required
                type='email'
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder='Email del agente'
                aria-label='Email del agente'
                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent'
              />
              <input
                type='text'
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder='Nombre (opcional)'
                aria-label='Nombre del agente'
                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent'
              />
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => setShowInvite(false)} className='flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'>Cancelar</button>
                <button
                  type='submit'
                  disabled={inviteLoading}
                  className='flex-1 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] disabled:opacity-50'
                >
                  {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
