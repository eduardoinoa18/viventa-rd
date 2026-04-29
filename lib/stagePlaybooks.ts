import { Timestamp } from 'firebase-admin/firestore'
import type { TransactionStage } from './domain/transaction'

export interface StagePlaybookTaskTemplate {
  title: string
  dueDaysFromNow: number
}

const PLAYBOOK_TASKS: Record<'contract' | 'closing', StagePlaybookTaskTemplate[]> = {
  contract: [
    { title: 'Programar inspeccion del inmueble', dueDaysFromNow: 3 },
    { title: 'Solicitar estudio de titulo', dueDaysFromNow: 5 },
    { title: 'Recopilar documentos del condominio', dueDaysFromNow: 7 },
    { title: 'Confirmar pre-aprobacion bancaria del comprador', dueDaysFromNow: 2 },
  ],
  closing: [
    { title: 'Confirmar fecha de cierre con notario', dueDaysFromNow: 1 },
    { title: 'Revisar acta de compra-venta', dueDaysFromNow: 2 },
    { title: 'Coordinar transferencia de fondos', dueDaysFromNow: 3 },
    { title: 'Preparar checklist de documentos para firma', dueDaysFromNow: 1 },
  ],
}

export function getStagePlaybookTemplates(stage: TransactionStage): StagePlaybookTaskTemplate[] {
  if (stage === 'contract' || stage === 'closing') {
    return PLAYBOOK_TASKS[stage]
  }
  return []
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

export async function createStagePlaybookTasks(params: {
  db: FirebaseFirestore.Firestore
  stage: TransactionStage
  dealId: string
  officeId: string
  agentId?: string | null
  createdBy: string
  linkedTransactionId?: string | null
}) {
  const { db, stage, dealId, officeId, agentId, createdBy, linkedTransactionId } = params
  const tasks = getStagePlaybookTemplates(stage)
  if (!tasks.length) return

  const now = new Date()
  const nowTs = Timestamp.fromDate(now)

  const writes = tasks.map(async (task, index) => {
    const docId = `playbook_${dealId}_${stage}_${index + 1}`
    const ref = db.collection('office_crm_tasks').doc(docId)
    const existing = await ref.get()
    if (existing.exists) return

    await ref.set({
      officeId,
      title: task.title,
      dueAt: Timestamp.fromDate(addDays(now, task.dueDaysFromNow)),
      status: 'pending',
      priority: 'normal',
      assigneeUid: agentId || createdBy,
      createdBy,
      createdAt: nowTs,
      updatedAt: nowTs,
      source: 'playbook',
      linkedDealId: dealId,
      linkedTransactionId: linkedTransactionId || dealId,
      playbookStage: stage,
      playbookKey: docId,
    })
  })

  await Promise.all(writes)
}
