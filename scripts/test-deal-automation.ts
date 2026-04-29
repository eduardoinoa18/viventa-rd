import {
  chooseLeastLoadedAssignee,
  isOpenAutomationTask,
  resolvePreferredBrokerAssigneeIds,
  resolvePreferredConstructoraAssigneeIds,
  shouldCreateDealTask,
  shouldEmitDealAlert,
} from '../lib/domain/dealAutomation'
import { TRANSACTION_STAGES } from '../lib/domain/transaction'
import { getStagePlaybookTemplates } from '../lib/stagePlaybooks'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

function test(name: string, fn: () => void): void {
  try {
    fn()
    console.log(`[PASS] ${name}`)
  } catch (error: any) {
    console.error(`[FAIL] ${name}: ${error?.message || error}`)
    process.exitCode = 1
  }
}

const NOW = new Date('2026-04-02T12:00:00.000Z').getTime()

test('emit alert when no previous status', () => {
  assert(shouldEmitDealAlert('', null, 'attention', NOW) === true, 'expected alert to emit with empty history')
})

test('do not emit alert when same status inside cooldown', () => {
  const lastAt = new Date(NOW - 2 * 60 * 60 * 1000)
  assert(shouldEmitDealAlert('attention', lastAt, 'attention', NOW) === false, 'expected cooldown block')
})

test('emit alert when status changes even inside cooldown', () => {
  const lastAt = new Date(NOW - 2 * 60 * 60 * 1000)
  assert(shouldEmitDealAlert('attention', lastAt, 'overdue', NOW) === true, 'expected status change to bypass cooldown')
})

test('create task only after repeat window for same status', () => {
  const lastAt = new Date(NOW - 6 * 60 * 60 * 1000)
  assert(shouldCreateDealTask('overdue', lastAt, 'overdue', NOW) === false, 'expected task cooldown block')
  const afterWindow = NOW + 25 * 60 * 60 * 1000
  assert(shouldCreateDealTask('overdue', lastAt, 'overdue', afterWindow) === true, 'expected task allowed after repeat window')
})

test('task open state excludes terminal statuses', () => {
  assert(isOpenAutomationTask('pending') === true, 'pending should be open')
  assert(isOpenAutomationTask('in_progress') === true, 'in_progress should be open')
  assert(isOpenAutomationTask('done') === false, 'done should be closed')
  assert(isOpenAutomationTask('closed') === false, 'closed should be closed')
  assert(isOpenAutomationTask('cancelled') === false, 'cancelled should be closed')
})

test('assignee routing prefers least load when no preferred candidate exists', () => {
  const assignee = chooseLeastLoadedAssignee({
    candidateIds: new Set(['u1', 'u2', 'u3']),
    preferredAssigneeIds: ['x1'],
    openTaskCountByAssignee: new Map([
      ['u1', 5],
      ['u2', 1],
      ['u3', 3],
    ]),
  })
  assert(assignee === 'u2', `expected u2, got ${assignee}`)
})

test('assignee routing honors preferred owner when within buffer', () => {
  const assignee = chooseLeastLoadedAssignee({
    candidateIds: new Set(['owner', 'u2']),
    preferredAssigneeIds: ['owner'],
    openTaskCountByAssignee: new Map([
      ['owner', 3],
      ['u2', 1],
    ]),
  })
  assert(assignee === 'owner', `expected owner preference, got ${assignee}`)
})

test('assignee routing avoids overloaded preferred owner', () => {
  const assignee = chooseLeastLoadedAssignee({
    candidateIds: new Set(['owner', 'u2']),
    preferredAssigneeIds: ['owner'],
    openTaskCountByAssignee: new Map([
      ['owner', 6],
      ['u2', 1],
    ]),
  })
  assert(assignee === 'u2', `expected u2 due to load, got ${assignee}`)
})

test('preferred assignee extraction for broker records is stable and deduped', () => {
  const ids = resolvePreferredBrokerAssigneeIds({
    agentId: 'a1',
    ownerAgentId: 'a1',
    assignedTo: 'a2',
    brokerId: 'b1',
  })
  assert(ids.join(',') === 'a1,a2,b1', `unexpected order/dedupe: ${ids.join(',')}`)
})

test('preferred assignee extraction for constructora records is stable and deduped', () => {
  const ids = resolvePreferredConstructoraAssigneeIds({
    updatedBy: 'c1',
    createdBy: 'c1',
    ownerId: 'c2',
    constructoraUserId: 'c3',
  })
  assert(ids.join(',') === 'c1,c2,c3', `unexpected order/dedupe: ${ids.join(',')}`)
})

test('transaction stage enum includes terminal lifecycle states', () => {
  assert(TRANSACTION_STAGES.includes('lost'), 'transaction stages should include lost')
  assert(TRANSACTION_STAGES.includes('archived'), 'transaction stages should include archived')
})

test('stage playbooks exist only for contract and closing', () => {
  assert(getStagePlaybookTemplates('contract').length > 0, 'contract should include playbook tasks')
  assert(getStagePlaybookTemplates('closing').length > 0, 'closing should include playbook tasks')
  assert(getStagePlaybookTemplates('lead').length === 0, 'lead should not include playbook tasks')
  assert(getStagePlaybookTemplates('lost').length === 0, 'lost should not include playbook tasks')
})

if (process.exitCode && process.exitCode !== 0) {
  console.error('Deal automation logic tests failed')
  process.exit(process.exitCode)
}

console.log('Deal automation logic tests passed')