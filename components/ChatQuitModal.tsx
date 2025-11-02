'use client'
import { useState } from 'react'

export default function ChatQuitModal({ open, onClose, agentId }: { open: boolean, onClose: () => void, agentId?: string }) {
  const [reason, setReason] = useState('no_respuesta')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const submit = async () => {
    setLoading(true)
    try {
      await fetch('/api/chat/quit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details, agentId })
      })
      onClose()
      alert('Gracias. Su solicitud de cambio de agente ha sido enviada.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b font-semibold text-[#0B2545]">Dejar a mi agente</div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600">Cuéntanos brevemente por qué deseas cambiar de agente. Esto nos ayuda a mejorar tu experiencia.</p>
          <label className="text-sm font-medium text-gray-700">Motivo</label>
          <select value={reason} onChange={e=>setReason(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="no_respuesta">No responde</option>
            <option value="disponibilidad">Disponibilidad limitada</option>
            <option value="comunicacion">Problemas de comunicación</option>
            <option value="conocimiento">Falta de conocimiento del mercado</option>
            <option value="otro">Otro</option>
          </select>
          <label className="text-sm font-medium text-gray-700">Detalles (opcional)</label>
          <textarea value={details} onChange={e=>setDetails(e.target.value)} maxLength={2000} rows={4} className="w-full border rounded px-3 py-2" placeholder="Agregar detalles" />
        </div>
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancelar</button>
          <button onClick={submit} disabled={loading} className="px-4 py-2 rounded bg-[#00A676] text-white disabled:opacity-60">{loading ? 'Enviando…' : 'Enviar solicitud'}</button>
        </div>
      </div>
    </div>
  )
}
