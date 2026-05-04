'use client'

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiDollarSign, FiMaximize2, FiUser } from 'react-icons/fi'
import type { TransactionRecord, TransactionStage } from '@/lib/domain/transaction'
import { TRANSACTION_STAGES } from '@/lib/domain/transaction'

interface ColumnConfig {
  stage: TransactionStage
  label: string
  color: string
  bg: string
  border: string
  dot: string
}

const COLUMNS: ColumnConfig[] = [
  { stage: 'lead', label: 'Lead', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400' },
  { stage: 'showing', label: 'Showing', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-400' },
  { stage: 'offer', label: 'Offer', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  { stage: 'reservation', label: 'Reservation', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  { stage: 'contract', label: 'Contract', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500' },
  { stage: 'closing', label: 'Closing', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  { stage: 'completed', label: 'Completed', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
  { stage: 'lost', label: 'Lost', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' },
  { stage: 'archived', label: 'Archived', color: 'text-zinc-700', bg: 'bg-zinc-50', border: 'border-zinc-200', dot: 'bg-zinc-500' },
]

function formatCurrency(amount: number, currency: 'USD' | 'DOP') {
  if (!isFinite(amount) || amount === 0) return currency === 'USD' ? '$0' : 'RD$0'
  const fmt = Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
  const symbol = currency === 'USD' ? '$' : 'RD$'
  if (amount >= 1_000_000) return `${symbol}${fmt.format(Math.round(amount / 1_000_000))}M`
  if (amount >= 1_000) return `${symbol}${fmt.format(Math.round(amount / 1_000))}K`
  return `${symbol}${fmt.format(amount)}`
}

interface DealCardProps {
  deal: TransactionRecord
  isDragging?: boolean
  onView?: (deal: TransactionRecord) => void
}

function DealCard({ deal, isDragging = false, onView }: DealCardProps) {
  const { attributes, listeners, setNodeRef, isDragging: isSortDragging } = useSortable({
    id: deal.id,
    data: { deal, type: 'deal' },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group relative select-none rounded-xl border bg-white shadow-sm
        transition-all duration-150 hover:shadow-md
        ${isSortDragging ? 'opacity-30' : ''}
        ${isDragging ? 'rotate-1 scale-105 shadow-xl ring-2 ring-[#00A676]/40' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      <div className="cursor-grab touch-none p-3.5 active:cursor-grabbing">
        <p className="truncate pr-6 text-sm font-semibold text-gray-900">{deal.clientName || 'Unknown Client'}</p>

        {(deal.unitId || deal.projectId) && (
          <p className="mt-0.5 truncate text-[11px] text-gray-400">
            {[deal.unitId, deal.projectId && `Proj: ${deal.projectId.slice(0, 8)}...`].filter(Boolean).join(' · ')}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <FiDollarSign className="shrink-0 text-[#00A676]" />
            {formatCurrency(deal.salePrice, deal.currency)}
          </span>
          {deal.totalCommission > 0 && (
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
              {formatCurrency(deal.totalCommission, deal.currency)}
            </span>
          )}
        </div>

        {deal.agentId && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
            <FiUser className="shrink-0" />
            <span className="truncate">{deal.agentId.slice(0, 10)}...</span>
          </div>
        )}
      </div>

      {onView && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onView(deal)
          }}
          className="absolute right-2 top-2 rounded-lg p-1.5 text-gray-300 opacity-0 transition-opacity
            group-hover:opacity-100 hover:bg-gray-100 hover:text-[#00A676]"
          aria-label="View deal"
        >
          <FiMaximize2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

interface KanbanColumnProps {
  config: ColumnConfig
  deals: TransactionRecord[]
  isOver?: boolean
  onCardClick?: (deal: TransactionRecord) => void
}

function KanbanColumn({ config, deals, isOver, onCardClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: config.stage, data: { type: 'column', stage: config.stage } })
  const dealIds = useMemo(() => deals.map((d) => d.id), [deals])

  return (
    <div className="flex min-w-[220px] max-w-[260px] flex-1 flex-col">
      <div className={`mb-2 flex items-center gap-2 rounded-xl border px-3 py-2 ${config.bg} ${config.border}`}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`} />
        <span className={`flex-1 text-xs font-bold uppercase tracking-wide ${config.color}`}>{config.label}</span>
        <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${config.color} ${config.border} ${config.bg}`}>
          {deals.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 overflow-y-auto rounded-xl border-2 border-dashed p-2 transition-colors duration-150 min-h-[120px]
          ${isOver ? 'border-[#00A676] bg-[#00A676]/5' : 'border-transparent bg-gray-50/60'}`}
      >
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onView={onCardClick} />
          ))}
        </SortableContext>
        {deals.length === 0 && <div className="flex flex-1 items-center justify-center text-xs text-gray-400">No deals</div>}
      </div>
    </div>
  )
}

export interface KanbanBoardProps {
  deals: TransactionRecord[]
  onStageChange: (dealId: string, newStage: TransactionStage, metadata?: { lostReason?: string }) => Promise<void>
  onCardClick?: (deal: TransactionRecord) => void
  loading?: boolean
  error?: string | null
}

export default function KanbanBoard({ deals, onStageChange, onCardClick, loading, error }: KanbanBoardProps) {
  const [items, setItems] = useState<TransactionRecord[]>(deals)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<{ dealId: string; fromStage: TransactionStage; toStage: TransactionStage } | null>(null)
  const [lostReason, setLostReason] = useState('')

  useEffect(() => {
    setItems(deals)
  }, [deals])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const grouped = useMemo(() => {
    const map = {} as Record<TransactionStage, TransactionRecord[]>
    TRANSACTION_STAGES.forEach((s) => {
      map[s] = []
    })
    items.forEach((d) => map[d.stage]?.push(d))
    return map
  }, [items])

  const activeDeal = useMemo(() => items.find((d) => d.id === activeId) ?? null, [items, activeId])

  const applyStageMove = useCallback(
    async (dealId: string, fromStage: TransactionStage, toStage: TransactionStage, metadata?: { lostReason?: string }) => {
      setItems((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: toStage } : d)))
      try {
        await onStageChange(dealId, toStage, metadata)
      } catch {
        setItems((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: fromStage } : d)))
      }
    },
    [onStageChange],
  )

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }, [])

  const handleDragOver = useCallback((e: DragOverEvent) => {
    const over = e.over
    if (!over) {
      setOverId(null)
      return
    }
    const overType = over.data?.current?.type
    if (overType === 'column') setOverId(String(over.id))
    else if (overType === 'deal') {
      const overDeal = over.data?.current?.deal as TransactionRecord
      if (overDeal) setOverId(overDeal.stage)
    }
  }, [])

  const handleDragEnd = useCallback(
    async (e: DragEndEvent) => {
      setActiveId(null)
      setOverId(null)

      const { active, over } = e
      if (!over || !active) return

      const draggedId = String(active.id)
      const overType = over.data?.current?.type

      let targetStage: TransactionStage | null = null
      if (overType === 'column') {
        targetStage = String(over.id) as TransactionStage
      } else if (overType === 'deal') {
        const overDeal = over.data?.current?.deal as TransactionRecord
        if (overDeal) targetStage = overDeal.stage
      }

      if (!targetStage) return

      const current = items.find((d) => d.id === draggedId)
      if (!current || current.stage === targetStage) return

      if (targetStage === 'lost') {
        setPendingMove({ dealId: draggedId, fromStage: current.stage, toStage: targetStage })
        setLostReason('')
        return
      }

      await applyStageMove(draggedId, current.stage, targetStage)
    },
    [items, applyStageMove],
  )

  const confirmLostMove = useCallback(async () => {
    if (!pendingMove) return
    const reason = lostReason.trim()
    if (!reason) return
    const { dealId, fromStage, toStage } = pendingMove
    setPendingMove(null)
    await applyStageMove(dealId, fromStage, toStage, { lostReason: reason })
  }, [pendingMove, lostReason, applyStageMove])

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-gray-500">Cargando pipeline...</div>
  }

  if (error) {
    return (
      <div className="flex h-32 items-center justify-center gap-2 text-sm text-red-600">
        <FiAlertCircle />
        {error}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.stage}
            config={col}
            deals={grouped[col.stage]}
            isOver={overId === col.stage}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>{activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}</DragOverlay>

      {pendingMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900">Motivo de perdida</h3>
            <p className="mt-1 text-xs text-gray-500">Debes registrar el motivo antes de mover este negocio a Perdido.</p>
            <textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ejemplo: Cliente eligió otra propiedad por presupuesto"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingMove(null)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmLostMove}
                disabled={!lostReason.trim()}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Confirmar perdida
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  )
}
