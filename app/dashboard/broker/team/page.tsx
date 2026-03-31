'use client'

import { useEffect, useState } from 'react'
import { FiMail, FiPlus, FiRefreshCw, FiUsers } from 'react-icons/fi'
import InviteModal from '@/components/InviteModal'

type TeamMember = {
  id: string
  name: string
  email: string
  role: string
  status: string
}

type PendingInvite = {
  id: string
  name: string
  email: string
  role: string
  status: string
  expiresAt?: string
}

type TeamSummary = {
  totalMembers: number
  activeMembers: number
  pendingMembers: number
}

function roleLabel(role: string) {
  if (role === 'broker') return 'Broker'
  if (role === 'agent') return 'Agente'
  return 'Miembro'
}

function statusLabel(status: string) {
  if (status === 'active') return 'Activo'
  if (status === 'pending') return 'Pendiente'
  return status || 'Sin estado'
}

function formatExpiry(value?: string) {
  if (!value) return 'Sin fecha de vencimiento'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha de vencimiento'
  return `Vence ${parsed.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })}`
}

export default function BrokerTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [summary, setSummary] = useState<TeamSummary>({ totalMembers: 0, activeMembers: 0, pendingMembers: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)

  async function loadTeam() {
    try {
      setLoading(true)
      setError('')

      const res = await fetch('/api/broker/team', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))

      if (res.ok) {
        setMembers(Array.isArray(json?.members) ? json.members : [])
        setPendingInvites(Array.isArray(json?.pendingInvites) ? json.pendingInvites : [])
        setSummary({
          totalMembers: Number(json?.summary?.totalMembers || 0),
          activeMembers: Number(json?.summary?.activeMembers || 0),
          pendingMembers: Number(json?.summary?.pendingMembers || 0),
        })
      } else {
        setMembers([])
        setPendingInvites([])
        setSummary({ totalMembers: 0, activeMembers: 0, pendingMembers: 0 })
        setError(String(json?.error || 'No se pudo cargar el equipo'))
      }
    } catch {
      setMembers([])
      setPendingInvites([])
      setSummary({ totalMembers: 0, activeMembers: 0, pendingMembers: 0 })
      setError('No se pudo cargar el equipo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTeam()
  }, [])

  return (
    <>
      <section className="rounded-2xl border border-[#0B2545]/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00A676]">Broker control</p>
            <h1 className="mt-2 text-2xl font-bold text-[#0B2545]">Equipo e invitaciones</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Gestiona agentes activos, sigue onboarding pendiente y recluta nuevos miembros desde el mismo flujo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadTeam()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#0B2545] hover:bg-gray-50"
            >
              <FiRefreshCw className="h-4 w-4" /> Actualizar
            </button>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B2545] px-3 py-2 text-sm font-semibold text-white hover:bg-[#134074]"
            >
              <FiPlus className="h-4 w-4" /> Invitar agente
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-[#0B2545]/10 bg-[#F6FBFF] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Estructura total</p>
            <p className="mt-2 text-3xl font-bold text-[#0B2545]">{summary.totalMembers}</p>
            <p className="mt-1 text-xs text-gray-600">Miembros vinculados a la oficina</p>
          </article>
          <article className="rounded-xl border border-[#00A676]/20 bg-[#F0FBF6] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Activos</p>
            <p className="mt-2 text-3xl font-bold text-[#0B2545]">{summary.activeMembers}</p>
            <p className="mt-1 text-xs text-gray-600">Listos para publicar, captar y colaborar</p>
          </article>
          <article className="rounded-xl border border-[#FF6B35]/20 bg-[#FFF6F1] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Onboarding pendiente</p>
            <p className="mt-2 text-3xl font-bold text-[#0B2545]">{summary.pendingMembers}</p>
            <p className="mt-1 text-xs text-gray-600">Invitaciones enviadas o perfiles aun sin activar</p>
          </article>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {loading ? <p className="mt-4 text-sm text-gray-600">Cargando equipo...</p> : null}

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr,1fr]">
          <section className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-2">
              <FiUsers className="h-4 w-4 text-[#0B2545]" />
              <h2 className="text-base font-semibold text-[#0B2545]">Roster activo</h2>
            </div>
            {!loading && members.length === 0 ? <p className="mt-3 text-sm text-gray-500">No hay miembros disponibles.</p> : null}
            <div className="mt-3 space-y-3">
              {members.map((member) => (
                <article key={member.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#0B2545]">{member.name || 'Sin nombre'}</div>
                      <div className="mt-1 text-xs text-gray-600">{member.email || 'Sin email'}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#E8F4FF] px-2.5 py-1 text-[11px] font-semibold text-[#0B2545]">
                        {roleLabel(member.role)}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${member.status === 'active' ? 'bg-[#F0FBF6] text-[#0B2545]' : 'bg-[#FFF6F1] text-[#A24C20]'}`}>
                        {statusLabel(member.status)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-2">
              <FiMail className="h-4 w-4 text-[#0B2545]" />
              <h2 className="text-base font-semibold text-[#0B2545]">Invitaciones activas</h2>
            </div>
            {!loading && pendingInvites.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No hay invitaciones abiertas. Usa el CTA para sumar tu proximo agente.</p>
            ) : null}
            <div className="mt-3 space-y-3">
              {pendingInvites.map((invite) => (
                <article key={invite.id} className="rounded-xl border border-[#FF6B35]/20 bg-[#FFF9F5] p-3">
                  <div className="text-sm font-semibold text-[#0B2545]">{invite.name || invite.email}</div>
                  <div className="mt-1 text-xs text-gray-600">{invite.email}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0B2545] border border-[#FFD7C6]">
                      {roleLabel(invite.role)}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#A24C20] border border-[#FFD7C6]">
                      {formatExpiry(invite.expiresAt)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      {showInviteModal ? (
        <InviteModal
          inviteType="agent"
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            void loadTeam()
          }}
        />
      ) : null}
    </>
  )
}
