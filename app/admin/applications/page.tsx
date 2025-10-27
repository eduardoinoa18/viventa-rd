'use client'
import { useEffect, useState } from 'react'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import { db } from '../../../lib/firebaseClient'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { FiCheck, FiX, FiUser, FiUsers, FiBriefcase, FiMail, FiPhone, FiCalendar } from 'react-icons/fi'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    loadApplications()
  }, [])

  async function loadApplications() {
    try {
      setLoading(true)
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const apps = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      setApplications(apps)
    } catch (err) {
      console.error('Error loading applications:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    try {
      await updateDoc(doc(db, 'applications', id), { status, reviewedAt: new Date() })
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status, reviewedAt: new Date() } : a))
      )
    } catch (err) {
      console.error('Error updating application:', err)
    }
  }

  async function deleteApplication(id: string) {
    if (!confirm('¿Eliminar esta aplicación permanentemente?')) return
    try {
      await deleteDoc(doc(db, 'applications', id))
      setApplications((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Error deleting application:', err)
    }
  }

  const filtered = applications.filter((a) => filter === 'all' || a.status === filter)

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#0B2545]">Aplicaciones de Profesionales</h1>
                <p className="text-gray-600 text-sm">Revisa y aprueba agentes, brokers y desarrolladores</p>
              </div>
              <button
                onClick={loadApplications}
                className="px-4 py-2 bg-[#00A6A6] text-white rounded hover:bg-[#008c8c]"
              >
                Actualizar
              </button>
            </div>

            {/* Filter tabs */}
            <div className="mb-6 flex gap-2 border-b">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    filter === f
                      ? 'border-[#00A6A6] text-[#00A6A6]'
                      : 'border-transparent text-gray-600 hover:text-[#0B2545]'
                  }`}
                >
                  {f === 'all' && 'Todas'}
                  {f === 'pending' && 'Pendientes'}
                  {f === 'approved' && 'Aprobadas'}
                  {f === 'rejected' && 'Rechazadas'}
                  {' '}
                  <span className="text-xs">
                    ({applications.filter((a) => f === 'all' || a.status === f).length})
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Cargando aplicaciones...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 bg-white rounded shadow">
                <p className="text-gray-500">No hay aplicaciones en esta categoría</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onApprove={() => updateStatus(app.id, 'approved')}
                    onReject={() => updateStatus(app.id, 'rejected')}
                    onDelete={() => deleteApplication(app.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function ApplicationCard({ app, onApprove, onReject, onDelete }: any) {
  const [expanded, setExpanded] = useState(false)
  const isPending = app.status === 'pending'
  const isApproved = app.status === 'approved'
  const isRejected = app.status === 'rejected'

  const typeIcon = app.type === 'broker' ? <FiUsers /> : app.type === 'agent' ? <FiUser /> : <FiBriefcase />
  const typeLabel = app.type === 'broker' ? 'Brokerage' : app.type === 'agent' ? 'Agente' : 'Desarrollador'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${isPending ? 'bg-yellow-100' : isApproved ? 'bg-green-100' : 'bg-red-100'}`}>
            {typeIcon}
          </div>
          <div>
            <div className="font-semibold text-[#0B2545] inline-flex items-center gap-2">
              {app.contact || 'Sin nombre'} — {typeLabel}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
              {app.email && (
                <span className="inline-flex items-center gap-1">
                  <FiMail className="text-gray-400" /> {app.email}
                </span>
              )}
              {app.phone && (
                <span className="inline-flex items-center gap-1">
                  <FiPhone className="text-gray-400" /> {app.phone}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
              <FiCalendar />
              {app.createdAt?.toDate?.()?.toLocaleDateString?.('es-DO') || 'Fecha desconocida'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-flex items-center gap-2"
              >
                <FiCheck /> Aprobar
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center gap-2"
              >
                <FiX /> Rechazar
              </button>
            </>
          )}
          {(isApproved || isRejected) && (
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {isApproved ? 'Aprobada' : 'Rechazada'}
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            {expanded ? 'Ocultar' : 'Ver detalles'}
          </button>
          <button onClick={onDelete} className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100">
            Eliminar
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Compañía:</strong> {app.company || 'N/A'}
            </div>
            <div>
              <strong>Sitio web:</strong> {app.website || 'N/A'}
            </div>
            <div>
              <strong>WhatsApp:</strong> {app.whatsapp || 'N/A'}
            </div>
            <div>
              <strong>Mercados:</strong> {app.markets || 'N/A'}
            </div>
            <div>
              <strong>Dirección:</strong> {app.address || 'N/A'}
            </div>
            <div>
              <strong>Moneda:</strong> {app.currency || 'USD'}
            </div>

            {/* Agent-specific */}
            {app.type === 'agent' && app.agent && (
              <>
                <div className="md:col-span-2 font-semibold text-[#0B2545] mt-2">Detalles del Agente</div>
                <div>
                  <strong>Licencia:</strong> {app.agent.license || 'N/A'}
                </div>
                <div>
                  <strong>Años de experiencia:</strong> {app.agent.years || 0}
                </div>
                <div>
                  <strong>Volumen (12m):</strong> ${app.agent.volume12m?.toLocaleString() || 0}
                </div>
                <div>
                  <strong>Transacciones (12m):</strong> {app.agent.transactions12m || 0}
                </div>
                <div>
                  <strong>Brokerage:</strong> {app.agent.brokerage || 'N/A'}
                </div>
                <div>
                  <strong>Idiomas:</strong> {app.agent.languages || 'N/A'}
                </div>
                <div className="md:col-span-2">
                  <strong>Especialidades:</strong> {app.agent.specialties || 'N/A'}
                </div>
              </>
            )}

            {/* Broker-specific */}
            {app.type === 'broker' && app.broker && (
              <>
                <div className="md:col-span-2 font-semibold text-[#0B2545] mt-2">Detalles del Brokerage</div>
                <div>
                  <strong>Agentes:</strong> {app.broker.agents || 0}
                </div>
                <div>
                  <strong>Años en negocio:</strong> {app.broker.years || 0}
                </div>
                <div>
                  <strong>Volumen anual (12m):</strong> ${app.broker.annualVolume12m?.toLocaleString() || 0}
                </div>
                <div>
                  <strong>Volumen anual (24m):</strong> ${app.broker.annualVolume24m?.toLocaleString() || 0}
                </div>
                <div>
                  <strong>Precio promedio:</strong> ${app.broker.avgPrice?.toLocaleString() || 0}
                </div>
                <div>
                  <strong>Listados activos:</strong> {app.broker.activeListings || 0}
                </div>
                <div>
                  <strong>Oficinas:</strong> {app.broker.offices || 1}
                </div>
                <div>
                  <strong>CRM:</strong> {app.broker.crm || 'N/A'}
                </div>
                <div>
                  <strong>Seguro E&O:</strong> {app.broker.insurance ? 'Sí' : 'No'}
                </div>
              </>
            )}

            {/* Developer-specific */}
            {app.type === 'developer' && app.developer && (
              <>
                <div className="md:col-span-2 font-semibold text-[#0B2545] mt-2">Detalles del Desarrollador</div>
                <div>
                  <strong>Proyectos activos:</strong> {app.developer.projects || 0}
                </div>
                <div className="md:col-span-2">
                  <strong>Pipeline:</strong> {app.developer.pipeline || 'N/A'}
                </div>
              </>
            )}

            {app.notes && (
              <div className="md:col-span-2 mt-2">
                <strong>Notas:</strong>
                <p className="mt-1 text-gray-700">{app.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
