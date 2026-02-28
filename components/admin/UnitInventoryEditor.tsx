'use client'

import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { FiPlus, FiTrash2, FiUpload, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'

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

type ImportMode = 'replace' | 'append'

type ParsedImport = {
  rows: UnitRow[]
  errors: string[]
}

const STATUS_ALIASES: Record<string, UnitRow['status']> = {
  available: 'available',
  disponible: 'available',
  reservada: 'reserved',
  reservado: 'reserved',
  reserved: 'reserved',
  sold: 'sold',
  vendida: 'sold',
  vendido: 'sold',
}

const COLUMN_ALIASES: Record<string, keyof UnitRow> = {
  unitnumber: 'unitNumber',
  unidad: 'unitNumber',
  unit: 'unitNumber',
  modeltype: 'modelType',
  modelo: 'modelType',
  tipo: 'modelType',
  sizemt2: 'sizeMt2',
  mt2: 'sizeMt2',
  m2: 'sizeMt2',
  metros: 'sizeMt2',
  price: 'price',
  precio: 'price',
  status: 'status',
  estado: 'status',
}

function normalizeHeader(value: string): keyof UnitRow | null {
  const key = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  return COLUMN_ALIASES[key] || null
}

function parseStatus(value: unknown): UnitRow['status'] {
  const normalized = String(value || 'available').trim().toLowerCase()
  return STATUS_ALIASES[normalized] || 'available'
}

function parseNumber(value: unknown): number {
  const numeric = Number(String(value ?? '').replace(/,/g, '').trim())
  return Number.isFinite(numeric) ? numeric : 0
}

function parseImportRows(rows: any[][]): ParsedImport {
  if (!rows.length) return { rows: [], errors: ['El archivo no contiene filas.'] }

  const rawHeaders = rows[0].map((item) => String(item || '').trim())
  const headerMap = rawHeaders.map((header) => normalizeHeader(header))
  const errors: string[] = []
  const parsed: UnitRow[] = []
  const seen = new Set<string>()

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    if (!Array.isArray(row) || row.every((cell) => String(cell || '').trim() === '')) continue

    const mapped: Partial<UnitRow> = {}
    row.forEach((cell, idx) => {
      const field = headerMap[idx]
      if (!field) return
      if (field === 'sizeMt2' || field === 'price') {
        mapped[field] = parseNumber(cell)
      } else if (field === 'status') {
        mapped[field] = parseStatus(cell)
      } else {
        mapped[field] = String(cell || '').trim() as never
      }
    })

    const unitNumber = String(mapped.unitNumber || '').trim()
    if (!unitNumber) {
      errors.push(`Fila ${rowIndex + 1}: falta unidad.`)
      continue
    }
    if (seen.has(unitNumber)) {
      errors.push(`Fila ${rowIndex + 1}: unidad duplicada (${unitNumber}) en archivo.`)
      continue
    }
    seen.add(unitNumber)

    parsed.push({
      unitNumber,
      modelType: String(mapped.modelType || 'General').trim() || 'General',
      sizeMt2: Math.max(0, Number(mapped.sizeMt2 || 0)),
      price: Math.max(0, Number(mapped.price || 0)),
      status: parseStatus(mapped.status),
    })
  }

  if (parsed.length === 0 && errors.length === 0) {
    errors.push('No se detectaron unidades válidas en el archivo.')
  }

  return { rows: parsed, errors }
}

async function readFileAsRows(file: File): Promise<any[][]> {
  const extension = file.name.toLowerCase().split('.').pop()
  if (extension === 'csv') {
    const text = await file.text()
    const workbook = XLSX.read(text, { type: 'string' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][]
  }

  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][]
}

export default function UnitInventoryEditor({ units, onChange }: UnitInventoryEditorProps) {
  const [importMode, setImportMode] = useState<ImportMode>('append')
  const [importing, setImporting] = useState(false)
  const [dryRunRows, setDryRunRows] = useState<UnitRow[]>([])
  const [dryRunErrors, setDryRunErrors] = useState<string[]>([])

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

  const dryRunSummary = useMemo(() => {
    if (!dryRunRows.length) return { add: 0, update: 0 }
    const existing = new Set(units.map((item) => item.unitNumber.trim()).filter(Boolean))
    const update = dryRunRows.filter((item) => existing.has(item.unitNumber)).length
    return { add: dryRunRows.length - update, update }
  }, [dryRunRows, units])

  async function handleImportFile(file: File | null) {
    if (!file) return
    try {
      setImporting(true)
      const rows = await readFileAsRows(file)
      const parsed = parseImportRows(rows)
      setDryRunRows(parsed.rows)
      setDryRunErrors(parsed.errors)
    } catch (error) {
      console.error('Import parse error:', error)
      setDryRunRows([])
      setDryRunErrors(['No se pudo leer el archivo. Verifica formato CSV/XLSX.'])
    } finally {
      setImporting(false)
    }
  }

  function applyImport() {
    if (!dryRunRows.length || dryRunErrors.length > 0) return

    if (importMode === 'replace') {
      onChange(dryRunRows)
      setDryRunRows([])
      return
    }

    const byUnit = new Map<string, UnitRow>()
    units.forEach((row) => byUnit.set(row.unitNumber.trim(), row))
    dryRunRows.forEach((row) => byUnit.set(row.unitNumber.trim(), row))
    onChange(Array.from(byUnit.values()))
    setDryRunRows([])
  }

  function downloadTemplate() {
    const templateRows = [
      ['unitNumber', 'modelType', 'sizeMt2', 'price', 'status'],
      ['A-101', '1 Hab', '62', '145000', 'available'],
      ['A-205', '2 Hab', '88', '198000', 'reserved'],
      ['B-PH01', 'PH 3 Hab', '160', '385000', 'sold'],
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(templateRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'units')
    XLSX.writeFile(workbook, 'units-import-template.xlsx')
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

      <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-[#0B2545]">Importación masiva (CSV/XLSX)</div>
            <div className="text-xs text-gray-600">Dry-run con validación antes de aplicar cambios al inventario.</div>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white hover:bg-gray-100"
          >
            Descargar plantilla
          </button>
        </div>

        <div className="mt-3 grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="unit-import-file">Archivo de unidades</label>
            <input
              id="unit-import-file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleImportFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="unit-import-mode">Modo de aplicación</label>
            <select
              id="unit-import-mode"
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as ImportMode)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            >
              <option value="append">Append/Update por unidad</option>
              <option value="replace">Reemplazar todo inventario</option>
            </select>
          </div>
        </div>

        {importing && (
          <div className="mt-2 text-xs text-gray-600">Procesando archivo...</div>
        )}

        {(dryRunRows.length > 0 || dryRunErrors.length > 0) && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-green-700"><FiCheckCircle /> {dryRunRows.length} filas válidas</span>
              <span className="inline-flex items-center gap-1 text-amber-700"><FiAlertTriangle /> {dryRunErrors.length} errores</span>
              <span className="text-gray-600">+{dryRunSummary.add} nuevas · {dryRunSummary.update} actualizadas</span>
            </div>

            {dryRunErrors.length > 0 && (
              <div className="mt-2 max-h-24 overflow-y-auto text-xs text-red-700 space-y-1">
                {dryRunErrors.map((err, idx) => (
                  <div key={`${err}-${idx}`}>• {err}</div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={applyImport}
                disabled={dryRunRows.length === 0 || dryRunErrors.length > 0}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-[#00A676] text-white rounded-lg hover:bg-[#008f64] disabled:opacity-50"
              >
                <FiUpload className="w-4 h-4" /> Aplicar importación
              </button>
              <button
                type="button"
                onClick={() => { setDryRunRows([]); setDryRunErrors([]) }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-100"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}
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
