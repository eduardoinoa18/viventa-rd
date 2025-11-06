'use client'
import { useEffect, useState } from 'react'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import ProtectedClient from '@/app/auth/ProtectedClient'
// Client Firestore not required for listing/deleting anymore; server API handles admin reads/writes
import { FiCheck, FiX, FiUser, FiUsers, FiBriefcase, FiMail, FiPhone, FiCalendar, FiMessageSquare } from 'react-icons/fi'

export default function ApplicationsPage() {
  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <ApplicationsPageContent />
    </ProtectedClient>
  )
}

function ApplicationsPageContent() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [notesModal, setNotesModal] = useState<{ app: any; status: 'approved' | 'rejected' } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadApplications(filter)
  }, [filter])

  async function loadApplications(nextFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'pending') {
    try {
      setLoading(true)
      const qs = nextFilter === 'all' ? '' : `?status=${encodeURIComponent(nextFilter)}`
      const res = await fetch(`/api/admin/applications${qs}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const apps = json?.data || []
      setApplications(apps)
    } catch (err: any) {
      console.error('Error loading applications:', err)
      alert('No se pudieron cargar las aplicaciones. Ver consola para detalles.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    const app = applications.find((a) => a.id === id)
    if (!app) return
    setNotesModal({ app, status })
  }

  async function submitReview(notes: string) {
    if (!notesModal) return
    const { app, status } = notesModal

    try {
      // Update in Firestore via API
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: app.id, status, notes, adminEmail: 'admin@viventa.com' }),
      })

      if (!res.ok) throw new Error('Failed to update application')
      const patchJson = await res.json().catch(() => null)
      const resetLink = patchJson?.resetLink
      const code = patchJson?.code

      // Send notification email
      await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: app.id,
          email: app.email,
          name: app.contact,
          status,
          notes,
          type: app.type,
          resetLink,
          code,
        }),
      })

      // Update local state
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status, reviewNotes: notes, reviewedAt: new Date() } : a))
      )

      setNotesModal(null)
    } catch (err) {
      console.error('Error submitting review:', err)
      alert('Error al actualizar la aplicación')
    }
  }

  async function deleteApplication(id: string) {
    if (!confirm('¿Eliminar esta aplicación permanentemente?')) return
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      setApplications((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Error deleting application:', err)
      alert('No se pudo eliminar la aplicación')
    }
  }

  const filtered = applications.filter((a) => filter === 'all' || a.status === filter)

  function toggleSelection(id: string) {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)))
    }
  }

  function exportToCSV() {
    const selected = applications.filter((a) => selectedIds.has(a.id))
    if (selected.length === 0) {
      alert('Selecciona al menos una aplicación para exportar')
      return
    }

    const headers = ['ID', 'Tipo', 'Nombre', 'Email', 'Teléfono', 'Compañía', 'Estado', 'Fecha', 'Notas']
    const rows = selected.map((a) => [
      a.id,
      a.type,
      a.contact || '',
      a.email || '',
      a.phone || '',
      a.company || '',
      a.status || 'pending',
      a.createdAt?.toDate?.()?.toLocaleDateString?.('es-DO') || '',
      a.reviewNotes || a.notes || '',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `applications_export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

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
              <div className="flex gap-2">
                {selectedIds.size > 0 && (
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-[#0B2545] text-white rounded hover:bg-[#134074]"
                  >
                    Exportar ({selectedIds.size})
                  </button>
                )}
                <button
                  onClick={() => loadApplications(filter)}
                  className="px-4 py-2 bg-[#00A6A6] text-white rounded hover:bg-[#008c8c]"
                >
                  Actualizar
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="mb-6 flex gap-2 border-b items-center">
              {filtered.length > 0 && (
                <div className="mr-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="mr-2 accent-[#00A6A6]"
                    aria-label="Seleccionar todas las aplicaciones visibles"
                  />
                  <span className="text-sm text-gray-600">Seleccionar todas</span>
                </div>
              )}
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
                <p className="text-gray-600 mb-2">No hay aplicaciones en esta categoría</p>
                <div className="max-w-xl mx-auto mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                  <div className="font-semibold text-blue-800 mb-1">¿Cómo ver aplicaciones aquí?</div>
                  <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
                    <li>Abre el formulario público desde el botón de abajo</li>
                    <li>Envía una solicitud de prueba (puede usar tu email)</li>
                    <li>Vuelve a esta pestaña y presiona “Actualizar”</li>
                  </ul>
                  <div className="mt-3">
                    <a
                      href="/apply"
                      target="_blank"
                      className="inline-block px-4 py-2 bg-[#00A676] text-white rounded-lg hover:bg-[#008F64] font-semibold"
                      rel="noopener noreferrer"
                    >
                      Abrir formulario de aplicación
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    selected={selectedIds.has(app.id)}
                    onToggleSelect={() => toggleSelection(app.id)}
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

      {/* Notes Modal */}
      {notesModal && (
        <NotesModal
          app={notesModal.app}
          status={notesModal.status}
          onSubmit={submitReview}
          onClose={() => setNotesModal(null)}
        />
      )}
    </div>
  )
}

function ApplicationCard({ app, selected, onToggleSelect, onApprove, onReject, onDelete }: any) {
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
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="accent-[#00A6A6] w-5 h-5"
            aria-label={`Seleccionar aplicación de ${app.contact || 'sin nombre'}`}
          />
          <div className={`p-3 rounded-full ${isPending ? 'bg-yellow-100' : isApproved ? 'bg-green-100' : 'bg-red-100'}`}>
            {typeIcon}
          </div>
          <div>
            <div className="font-semibold text-[#0B2545] inline-flex items-center gap-2">
              {app.contact || 'Sin nombre'} — {typeLabel}
              {app.assignedCode && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-mono">
                  {app.assignedCode}
                </span>
              )}
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
              {app.linkedUid && (
                <a
                  href={`/admin/users`}
                  onClick={(e) => {
                    e.stopPropagation()
                    // In a real implementation, you'd navigate to the user detail or filter by this uid
                  }}
                  className="inline-flex items-center gap-1 text-[#00A6A6] hover:text-[#008c8c] font-medium"
                  title="Ver perfil de usuario"
                >
                  <FiUser className="text-sm" /> Ver perfil
                </a>
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
          {isApproved && (
            <button
              onClick={async () => {
                try {
                  await fetch('/api/admin/applications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      applicationId: app.id,
                      email: app.email,
                      name: app.contact,
                      status: 'approved',
                      notes: app.reviewNotes || '',
                      type: app.type,
                      code: app.assignedCode || undefined
                    })
                  })
                  alert('Correo de bienvenida reenviado')
                } catch (e) {
                  alert('No se pudo reenviar el correo')
                }
              }}
              className="px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              title="Reenviar correo de bienvenida"
            >
              Reenviar email
            </button>
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
        <div className="border-t border-gray-200 p-0">
          <div className="bg-gradient-to-r from-[#0B2545] to-[#134074] text-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 rounded bg-white/10 text-xs font-semibold uppercase">{app.type}</span>
              {app.pathway && (
                <span className="px-2 py-1 rounded bg-white/10 text-xs font-semibold uppercase">{app.pathway}</span>
              )}
              <span className={`px-2 py-1 rounded text-xs font-semibold ${isApproved?'bg-green-500/80':'bg-yellow-500/80'}`}>{app.status}</span>
              {app.assignedCode && (
                <span className="px-2 py-1 rounded bg-white/10 text-xs font-mono">Código: {app.assignedCode}</span>
              )}
            </div>
          </div>
          <div className="p-4 bg-gray-50 grid md:grid-cols-2 gap-6">
            <section className="bg-white rounded-lg border shadow-sm p-4">
              <h4 className="font-semibold text-[#0B2545] mb-3">Contacto</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Nombre:</strong> {app.contact || '—'}</div>
                <div><strong>Email:</strong> {app.email || '—'}</div>
                <div><strong>Teléfono:</strong> {app.phone || '—'}</div>
                <div><strong>Fecha:</strong> {app.createdAt?.toDate?.()?.toLocaleString?.('es-DO') || '—'}</div>
              </div>
            </section>
            <section className="bg-white rounded-lg border shadow-sm p-4">
              <h4 className="font-semibold text-[#0B2545] mb-3">Negocio</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2"><strong>Compañía/Brokerage:</strong> {app.company || '—'}</div>
                <div className="col-span-2"><strong>Website:</strong> {app.website ? <a className="text-[#004AAD] underline" href={app.website} target="_blank">{app.website}</a> : '—'}</div>
                <div className="col-span-2"><strong>Dirección:</strong> {app.address || '—'}</div>
                <div><strong>Moneda:</strong> {app.currency || 'USD'}</div>
                <div><strong>Mercados:</strong> {app.markets || '—'}</div>
              </div>
            </section>
            {(app.type === 'agent' || app.type === 'new-agent') && (
              <section className="bg-white rounded-lg border shadow-sm p-4">
                <h4 className="font-semibold text-[#0B2545] mb-3">Experiencia / Perfil</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Licencia:</strong> {app.license || '—'}</div>
                  <div><strong>Años:</strong> {app.years ?? '—'}</div>
                  <div className="col-span-2"><strong>Brokerage:</strong> {app.brokerage || '—'}</div>
                  <div className="col-span-2"><strong>Volumen 12m:</strong> {app.volume12m ? `$ ${Number(app.volume12m).toLocaleString()}` : '—'}</div>
                </div>
                {app.type === 'new-agent' && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div><strong>Educación:</strong> {app.education || '—'}</div>
                    <div><strong>Disponibilidad:</strong> {app.availability || '—'}</div>
                    <div>
                      <strong>¿Por qué bienes raíces?</strong>
                      <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-700 whitespace-pre-wrap">{app.whyRealEstate || '—'}</div>
                    </div>
                  </div>
                )}
              </section>
            )}
            {app.type === 'broker' && (
              <section className="bg-white rounded-lg border shadow-sm p-4">
                <h4 className="font-semibold text-[#0B2545] mb-3">Brokerage</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Agentes:</strong> {app.agents ?? '—'}</div>
                  <div><strong>Oficinas:</strong> {app.offices ?? '—'}</div>
                  <div><strong>CRM:</strong> {app.crm || '—'}</div>
                  <div><strong>Seguro E&O:</strong> {app.insurance ? 'Sí' : 'No'}</div>
                  <div className="col-span-2"><strong>Volumen anual (12m):</strong> {app.annualVolume12m ? `$ ${Number(app.annualVolume12m).toLocaleString()}` : '—'}</div>
                </div>
              </section>
            )}
            <section className="bg-white rounded-lg border shadow-sm p-4">
              <h4 className="font-semibold text-[#0B2545] mb-3">Idiomas y Especialidades</h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {(String(app.languages || '').split(',').map((s:string)=>s.trim()).filter(Boolean)).map((lang:string, i:number)=>(
                  <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full border">{lang}</span>
                ))}
                {!(app.languages) && <span className="text-gray-500">—</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {(String(app.specialties || '').split(',').map((s:string)=>s.trim()).filter(Boolean)).map((sp:string, i:number)=>(
                  <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full border">{sp}</span>
                ))}
                {!(app.specialties) && <span className="text-gray-500">—</span>}
              </div>
            </section>
            <section className="bg-white rounded-lg border shadow-sm p-4 md:col-span-2">
              <h4 className="font-semibold text-[#0B2545] mb-3">Motivación / Detalles</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Descripción de negocio</div>
                  <div className="p-3 bg-gray-50 rounded border text-gray-700 whitespace-pre-wrap">{app.businessDetails || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Redes sociales</div>
                  <div className="p-3 bg-gray-50 rounded border text-gray-700 whitespace-pre-wrap">{app.socialMedia || '—'}</div>
                </div>
              </div>
              <div className="mt-3 text-sm"><strong>Fuente de referencia:</strong> {app.referralSource || '—'}</div>
            </section>
            {(app.resumeUrl || app.documentUrl) && (
              <section className="bg-white rounded-lg border shadow-sm p-4 md:col-span-2">
                <h4 className="font-semibold text-[#0B2545] mb-3">Adjuntos</h4>
                <div className="flex flex-wrap gap-3">
                  {app.resumeUrl && (<a href={app.resumeUrl} target="_blank" className="px-3 py-2 bg-gray-100 rounded border hover:bg-gray-200">Ver Currículum</a>)}
                  {app.documentUrl && (<a href={app.documentUrl} target="_blank" className="px-3 py-2 bg-gray-100 rounded border hover:bg-gray-200">Ver Documento</a>)}
                </div>
              </section>
            )}
            <section className="bg-white rounded-lg border shadow-sm p-4 md:col-span-2">
              <h4 className="font-semibold text-[#0B2545] mb-3">Sistema</h4>
              <div className="grid md:grid-cols-3 gap-2 text-sm">
                <div><strong>UID vinculado:</strong> {app.linkedUid || '—'}</div>
                <div><strong>Código asignado:</strong> {app.assignedCode || '—'}</div>
                <div><strong>Notas de revisión:</strong> {app.reviewNotes || '—'}</div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

function NotesModal({ app, status, onSubmit, onClose }: any) {
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit() {
    setSending(true)
    await onSubmit(notes)
    setSending(false)
  }

  const isApproval = status === 'approved'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#0B2545] inline-flex items-center gap-2">
            <FiMessageSquare />
            {isApproval ? 'Aprobar aplicación' : 'Rechazar aplicación'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>{app.contact}</strong> ({app.email}) — {app.type}
          </p>
          <p className="text-sm text-gray-600">
            {isApproval
              ? 'Agrega un mensaje de bienvenida opcional que se enviará por email.'
              : 'Agrega una nota explicando por qué se rechaza (opcional pero recomendado).'}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isApproval ? 'Mensaje de bienvenida (opcional)' : 'Motivo del rechazo (opcional)'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isApproval
                ? 'Ej: Bienvenido al equipo. Un representante te contactará pronto para configurar tu cuenta.'
                : 'Ej: No cumple con los requisitos mínimos de experiencia.'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
            rows={4}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending}
            className={`px-4 py-2 rounded text-white disabled:opacity-50 inline-flex items-center gap-2 ${
              isApproval ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {sending ? 'Enviando...' : isApproval ? <><FiCheck /> Aprobar y notificar</> : <><FiX /> Rechazar y notificar</>}
          </button>
        </div>
      </div>
    </div>
  )
}
