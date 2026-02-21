import { NextResponse } from 'next/server'
import { getMasterSession, type MasterRole, type MasterSession } from './session'

export type RequireMasterSessionResult = MasterSession

const DEFAULT_ROLES: MasterRole[] = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT']

let sessionResolver: () => Promise<MasterSession | null> = getMasterSession

export function __setMasterSessionResolverForTests(resolver: () => Promise<MasterSession | null>) {
  sessionResolver = resolver
}

export function __resetMasterSessionResolverForTests() {
  sessionResolver = getMasterSession
}

export async function requireMasterSession(
  options?: { roles?: MasterRole[] }
): Promise<RequireMasterSessionResult | NextResponse> {
  const session = await sessionResolver()

  if (!session) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }

  if (!session.role) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  const allowedRoles = options?.roles?.length ? options.roles : DEFAULT_ROLES
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  return session
}
