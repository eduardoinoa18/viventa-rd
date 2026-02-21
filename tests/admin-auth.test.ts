import test from 'node:test'
import assert from 'node:assert/strict'
import {
  requireMasterSession,
  __resetMasterSessionResolverForTests,
  __setMasterSessionResolverForTests,
} from '../lib/auth/requireMasterSession'
import type { MasterSession } from '../lib/auth/session'

function mockSession(session: MasterSession | null) {
  __setMasterSessionResolverForTests(async () => session)
}

test('Unauthenticated request -> 401', async () => {
  mockSession(null)
  const result = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  assert.ok(result instanceof Response)
  assert.equal(result.status, 401)
  __resetMasterSessionResolverForTests()
})

test('Authenticated non-admin role missing -> 403', async () => {
  mockSession({ uid: 'u1', email: 'x@y.com', role: '' as any })
  const result = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  assert.ok(result instanceof Response)
  assert.equal(result.status, 403)
  __resetMasterSessionResolverForTests()
})

test('Admin wrong role -> 403', async () => {
  mockSession({ uid: 'u2', email: 'admin@y.com', role: 'SUPPORT' })
  const result = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  assert.ok(result instanceof Response)
  assert.equal(result.status, 403)
  __resetMasterSessionResolverForTests()
})

test('Correct role -> 200-equivalent (session returned)', async () => {
  const session: MasterSession = { uid: 'u3', email: 'super@y.com', role: 'SUPER_ADMIN' }
  mockSession(session)
  const result = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  assert.deepEqual(result, session)
  __resetMasterSessionResolverForTests()
})
