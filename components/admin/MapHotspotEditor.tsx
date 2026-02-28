'use client'

import { FiPlus, FiTrash2 } from 'react-icons/fi'

export interface ProjectMapHotspot {
  id: string
  unitNumber: string
  label: string
  xPercent: number
  yPercent: number
}

interface MapHotspotEditorProps {
  hotspots: ProjectMapHotspot[]
  units: Array<{ unitNumber?: string }>
  onChange: (hotspots: ProjectMapHotspot[]) => void
}

function createHotspotId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `hotspot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function MapHotspotEditor({ hotspots, units, onChange }: MapHotspotEditorProps) {
  const unitOptions = Array.from(new Set(units.map((unit) => String(unit.unitNumber || '').trim()).filter(Boolean)))

  function addHotspot() {
    onChange([
      ...hotspots,
      {
        id: createHotspotId(),
        unitNumber: unitOptions[0] || '',
        label: '',
        xPercent: 50,
        yPercent: 50,
      },
    ])
  }

  function removeHotspot(index: number) {
    const next = [...hotspots]
    next.splice(index, 1)
    onChange(next)
  }

  function updateHotspot(index: number, field: keyof ProjectMapHotspot, value: string | number) {
    const next = [...hotspots]
    const current = { ...next[index] }

    if (field === 'xPercent' || field === 'yPercent') {
      const numeric = Number(value || 0)
      current[field] = Math.max(0, Math.min(100, numeric)) as never
    } else {
      current[field] = value as never
    }

    next[index] = current
    onChange(next)
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[#0B2545]">Hotspots en mapa</h4>
          <p className="text-xs text-gray-500">Vincula puntos del mapa con unidades para interacción en el listing público.</p>
        </div>
        <button
          type="button"
          onClick={addHotspot}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-[#0B2545] text-white rounded-lg hover:bg-[#143a66]"
        >
          <FiPlus className="w-4 h-4" /> Agregar punto
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Unidad</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Etiqueta</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">X (%)</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Y (%)</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody>
            {hotspots.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                  Aún no hay hotspots configurados.
                </td>
              </tr>
            ) : (
              hotspots.map((hotspot, index) => (
                <tr key={hotspot.id || index} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-2">
                    <select
                      value={hotspot.unitNumber}
                      onChange={(e) => updateHotspot(index, 'unitNumber', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      aria-label={`Unidad hotspot ${index + 1}`}
                    >
                      <option value="">Seleccionar</option>
                      {unitOptions.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={hotspot.label || ''}
                      onChange={(e) => updateHotspot(index, 'label', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="Ej: Torre A - 4B"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={hotspot.xPercent ?? 0}
                      onChange={(e) => updateHotspot(index, 'xPercent', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      aria-label={`Posición X hotspot ${index + 1}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={hotspot.yPercent ?? 0}
                      onChange={(e) => updateHotspot(index, 'yPercent', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      aria-label={`Posición Y hotspot ${index + 1}`}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeHotspot(index)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-red-700 bg-red-50 rounded hover:bg-red-100"
                      aria-label={`Eliminar hotspot ${index + 1}`}
                      title="Eliminar hotspot"
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

      <p className="text-xs text-gray-500">
        Los puntos usan coordenadas porcentuales sobre la imagen del mapa para adaptarse en móvil y desktop.
      </p>
    </div>
  )
}
