'use client'

import { FiCheck, FiX } from 'react-icons/fi'

interface BulkActionsProps {
  selectedCount: number
  allSelected: boolean
  onToggleAll: () => void
  onBulkApprove: () => void
  onBulkReject: () => void
}

export default function BulkActions({
  selectedCount,
  allSelected,
  onToggleAll,
  onBulkApprove,
  onBulkReject,
}: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          className="h-5 w-5"
          aria-label="Seleccionar todas las propiedades"
        />
        <span className="text-sm font-medium text-blue-900">
          {selectedCount} propiedad(es) seleccionada(s)
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBulkApprove}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
        >
          <FiCheck /> Aprobar
        </button>
        <button
          onClick={onBulkReject}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
        >
          <FiX /> Rechazar
        </button>
      </div>
    </div>
  )
}
