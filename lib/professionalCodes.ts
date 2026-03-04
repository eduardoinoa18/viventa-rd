type ProfessionalRole = 'agent' | 'broker' | 'constructora'

function normalizeRole(role: string): ProfessionalRole {
  if (role === 'broker') return 'broker'
  if (role === 'constructora') return 'constructora'
  return 'agent'
}

function rolePrefix(role: ProfessionalRole): string {
  if (role === 'broker') return 'BRK'
  if (role === 'constructora') return 'CST'
  return 'AGT'
}

export function roleCodeField(role: string): 'agentCode' | 'brokerCode' | 'constructoraCode' {
  const normalized = normalizeRole(role)
  if (normalized === 'broker') return 'brokerCode'
  if (normalized === 'constructora') return 'constructoraCode'
  return 'agentCode'
}

function buildCandidateCode(role: ProfessionalRole): string {
  const prefix = rolePrefix(role)
  const numeric = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}-${numeric}`
}

export async function ensureProfessionalCode(params: {
  adminDb: any
  role: string
  userId?: string
  userData?: Record<string, any> | null
}): Promise<{ code: string; field: 'agentCode' | 'brokerCode' | 'constructoraCode'; role: ProfessionalRole }> {
  const { adminDb, role, userData } = params
  const normalizedRole = normalizeRole(role)
  const field = roleCodeField(normalizedRole)

  const existing = String(userData?.[field] || userData?.professionalCode || '').trim()
  if (existing) {
    return { code: existing, field, role: normalizedRole }
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = buildCandidateCode(normalizedRole)
    const conflictSnap = await adminDb
      .collection('users')
      .where('professionalCode', '==', candidate)
      .limit(1)
      .get()

    if (conflictSnap.empty) {
      return { code: candidate, field, role: normalizedRole }
    }
  }

  const fallback = `${rolePrefix(normalizedRole)}-${Date.now().toString().slice(-6)}`
  return { code: fallback, field, role: normalizedRole }
}
