'use client'

import { FiPlus, FiTrash2 } from 'react-icons/fi'

export interface UnitRow {
  unitNumber: string
  modelType: string
  sizeMt2: number
  price: number
  status: 'available' | 'reserved' | 'sold'
}

interface UnitInventoryEditorProps {
  units: UnitRow[]
  onChange: (units: UnitRow[]) => void
}

export default function UnitInventoryEditor({ units, onChange }: UnitInventoryEditorProps) {
  function addUnit() {
    onChange([
      ...units,
      {
        unitNumber: '',
        modelType: 'General',
        sizeMt2: 0,
        price: 0,
        status: 'available',
      },
    ])
  }

  function removeUnit(index: number) {
    const next = [...units]
    next.splice(index, 1)
    onChange(next)
  }

  function updateUnit(index: number, field: keyof UnitRow, value: string | number) {
    const next = [...units]
    const updated = { ...next[index] }

    if (field === 'sizeMt2' || field === 'price') {
      updated[field] = Number(value || 0) as never
    } else {
      updated[field] = value as never
    }

    next[index] = updated
    onChange(next)
  }

  const summary = {
    total: units.length,
    available: units.filter((u) => u.status === 'available').length,
    reserved: units.filter((u) => u.status === 'reserved').length,
    sold: units.filter((u) => u.status === 'sold').length,
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Inventario por unidad</label>
        <button
          type="button"
          onClick={addUnit}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-[#0B2545] text-white rounded-lg hover:bg-[#143a66]"
        >
          <FiPlus className="w-4 h-4" /> Agregar unidad
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Unidad</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Modelo</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">m²</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Precio</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Estado</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                  No hay unidades cargadas.
                </td>
              </tr>
            ) : (
              units.map((unit, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-2">
                    <input
                      value={unit.unitNumber}
                      onChange={(e) => updateUnit(index, 'unitNumber', e.target.value)}
                      placeholder="Ej: A-302"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={unit.modelType}
                      onChange={(e) => updateUnit(index, 'modelType', e.target.value)}
                      placeholder="1 Hab"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      aria-label={`Metros cuadrados unidad ${index + 1}`}
                      title="Metros cuadrados"
                      value={unit.sizeMt2 || 0}
                      onChange={(e) => updateUnit(index, 'sizeMt2', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      aria-label={`Precio unidad ${index + 1}`}
                      title="Precio de unidad"
                      value={unit.price || 0}
                      onChange={(e) => updateUnit(index, 'price', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={unit.status}
                      onChange={(e) => updateUnit(index, 'status', e.target.value as UnitRow['status'])}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      aria-label="Estado de unidad"
                    >
                      <option value="available">Disponible</option>
                      <option value="reserved">Separada</option>
                      <option value="sold">Vendida</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeUnit(index)}
                      aria-label={`Eliminar unidad ${unit.unitNumber || index + 1}`}
                      title="Eliminar unidad"
                      className="inline-flex items-center gap-1 px-2 py-1 text-red-700 bg-red-50 rounded hover:bg-red-100"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-600 flex flex-wrap gap-4">
        <span>Total: {summary.total}</span>
        <span>Disponibles: {summary.available}</span>
        <span>Separadas: {summary.reserved}</span>
        <span>Vendidas: {summary.sold}</span>
      </div>
    </div>
  )
}
