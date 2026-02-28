'use client'

import { useMemo, useState } from 'react'
import { FiPlus, FiTrash2, FiCrosshair, FiGrid } from 'react-icons/fi'

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
  mapImageUrl?: string
  onChange: (hotspots: ProjectMapHotspot[]) => void
}

const PERCENT_POSITION_CLASS: Record<number, string> = {
  0: '0',
  5: '[5%]',
  10: '[10%]',
  15: '[15%]',
  20: '[20%]',
  25: '[25%]',
  30: '[30%]',
  35: '[35%]',
  40: '[40%]',
  45: '[45%]',
  50: '[50%]',
  55: '[55%]',
  60: '[60%]',
  65: '[65%]',
  70: '[70%]',
  75: '[75%]',
  80: '[80%]',
  85: '[85%]',
  90: '[90%]',
  95: '[95%]',
  100: 'full',
}

function percentToPositionClass(axis: 'left' | 'top', value: number) {
  const clamped = Math.max(0, Math.min(100, Math.round(value / 5) * 5))
  const token = PERCENT_POSITION_CLASS[clamped] || '0'
  return token === 'full' ? `${axis}-full` : `${axis}-${token}`
}

function createHotspotId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `hotspot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function MapHotspotEditor({ hotspots, units, mapImageUrl, onChange }: MapHotspotEditorProps) {
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('')
  const [selectedUnitForNewHotspot, setSelectedUnitForNewHotspot] = useState('')
  const unitOptions = Array.from(new Set(units.map((unit) => String(unit.unitNumber || '').trim()).filter(Boolean)))
  const hotspotsByUnit = useMemo(() => new Map(hotspots.map((h) => [h.unitNumber, h])), [hotspots])

  function addHotspot() {
    const unitCandidate = selectedUnitForNewHotspot || unitOptions.find((unit) => !hotspotsByUnit.has(unit)) || unitOptions[0] || ''
    onChange([
      ...hotspots,
      {
        id: createHotspotId(),
        unitNumber: unitCandidate,
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

  function updateHotspotById(id: string, xPercent: number, yPercent: number) {
    const next = hotspots.map((point) =>
      point.id === id
        ? { ...point, xPercent: Math.max(0, Math.min(100, xPercent)), yPercent: Math.max(0, Math.min(100, yPercent)) }
        : point
    )
    onChange(next)
  }

  function handleMapClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!mapImageUrl || unitOptions.length === 0) return

    const rect = event.currentTarget.getBoundingClientRect()
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100

    if (selectedHotspotId) {
      updateHotspotById(selectedHotspotId, xPercent, yPercent)
      return
    }

    const unitCandidate = selectedUnitForNewHotspot || unitOptions.find((unit) => !hotspotsByUnit.has(unit)) || unitOptions[0]
    if (!unitCandidate) return

    onChange([
      ...hotspots,
      {
        id: createHotspotId(),
        unitNumber: unitCandidate,
        label: '',
        xPercent,
        yPercent,
      },
    ])
  }

  function autoGenerateLayout() {
    if (!unitOptions.length) return
    const columns = Math.min(Math.max(Math.ceil(Math.sqrt(unitOptions.length)), 2), 6)
    const rows = Math.ceil(unitOptions.length / columns)
    const generated: ProjectMapHotspot[] = unitOptions.map((unit, idx) => {
      const col = idx % columns
      const row = Math.floor(idx / columns)
      const xPercent = ((col + 1) / (columns + 1)) * 100
      const yPercent = ((row + 1) / (rows + 1)) * 100
      return {
        id: createHotspotId(),
        unitNumber: unit,
        label: '',
        xPercent,
        yPercent,
      }
    })
    onChange(generated)
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[#0B2545]">Hotspots en mapa</h4>
          <p className="text-xs text-gray-500">Haz click sobre el mapa para ubicar unidades. Mucho más fácil que editar X/Y manual.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={autoGenerateLayout}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 bg-white rounded-lg hover:bg-gray-100"
          >
            <FiGrid className="w-4 h-4" /> Auto layout
          </button>
          <button
            type="button"
            onClick={addHotspot}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-[#0B2545] text-white rounded-lg hover:bg-[#143a66]"
          >
            <FiPlus className="w-4 h-4" /> Agregar punto
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="hotspot-new-unit">Unidad para nuevo punto</label>
          <select
            id="hotspot-new-unit"
            value={selectedUnitForNewHotspot}
            onChange={(e) => setSelectedUnitForNewHotspot(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded"
          >
            <option value="">Auto seleccionar</option>
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="hotspot-active">Reubicar punto existente</label>
          <select
            id="hotspot-active"
            value={selectedHotspotId}
            onChange={(e) => setSelectedHotspotId(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded"
          >
            <option value="">Crear nuevo con click</option>
            {hotspots.map((point) => (
              <option key={point.id} value={point.id}>{point.unitNumber}</option>
            ))}
          </select>
        </div>
      </div>

      {mapImageUrl ? (
        <div
          className="relative rounded-lg border border-gray-200 overflow-hidden cursor-crosshair"
          onClick={handleMapClick}
        >
          <img src={mapImageUrl} alt="Mapa de proyecto" className="w-full" />
          {hotspots.map((point) => {
            const xClass = percentToPositionClass('left', point.xPercent)
            const yClass = percentToPositionClass('top', point.yPercent)
            const active = selectedHotspotId === point.id
            return (
              <button
                key={point.id}
                type="button"
                title={point.unitNumber}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedHotspotId(point.id)
                }}
                className={`absolute ${xClass} ${yClass} -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 bg-[#00A676] border-white shadow ${active ? 'ring-4 ring-[#0B2545]/20 scale-110' : ''}`}
                aria-label={`Hotspot ${point.unitNumber}`}
              />
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-xs text-gray-500">
          Sube o selecciona una imagen de mapa para activar el modo de click dinámico.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Unidad</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Etiqueta</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Posición</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody>
            {hotspots.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
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
                    <button
                      type="button"
                      onClick={() => setSelectedHotspotId(hotspot.id)}
                      className={`inline-flex items-center gap-2 px-2 py-1 rounded border ${selectedHotspotId === hotspot.id ? 'border-[#00A676] bg-[#00A676]/10 text-[#0B2545]' : 'border-gray-300 bg-white text-gray-700'}`}
                    >
                      <FiCrosshair className="w-3.5 h-3.5" />
                      {Math.round(hotspot.xPercent)}% · {Math.round(hotspot.yPercent)}%
                    </button>
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
        Tip: selecciona una unidad y haz click en el mapa para posicionarla. También puedes auto-generar una cuadrícula base y luego ajustar con clicks.
      </p>
    </div>
  )
}
