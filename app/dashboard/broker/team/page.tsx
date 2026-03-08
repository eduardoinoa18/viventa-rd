'use client'

import { useEffect, useState } from 'react'

type TeamMember = {
  id: string
  name?: string
  email?: string
  role?: string
  status?: string
}

export default function BrokerTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const res = await fetch('/api/broker/team', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok) {
          setMembers(Array.isArray(json?.members) ? json.members : [])
        } else {
          setMembers([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-[#0B2545]">Team</h2>
      {loading ? <p className="mt-2 text-sm text-gray-600">Cargando equipo...</p> : null}
      {!loading && members.length === 0 ? <p className="mt-2 text-sm text-gray-500">No hay miembros disponibles.</p> : null}
      <div className="mt-3 space-y-2">
        {members.map((member) => (
          <div key={member.id} className="rounded-lg border border-gray-200 p-3">
            <div className="text-sm font-semibold text-[#0B2545]">{member.name || 'Sin nombre'}</div>
            <div className="text-xs text-gray-600 mt-1">{member.email || 'Sin email'} • {member.role || 'role'} • {member.status || 'status'}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
