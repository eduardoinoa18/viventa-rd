"use client"
import { useState } from 'react'
import { auth, firestore } from '../lib/firebaseClient'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

export default function SavedSearchModal({ query, onClose }: { query: any; onClose: () => void }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!auth?.currentUser) return alert('Login required')
    setSaving(true)
    await addDoc(collection(firestore, 'users', auth.currentUser.uid, 'saved_searches'), {
      name: name || 'Búsqueda',
      query,
      createdAt: serverTimestamp(),
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-2">Guardar búsqueda</h3>
        <input
          className="w-full px-3 py-2 border rounded"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-2 border rounded">Cancelar</button>
          <button onClick={save} disabled={saving} className="px-3 py-2 bg-[#00A6A6] text-white rounded">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
