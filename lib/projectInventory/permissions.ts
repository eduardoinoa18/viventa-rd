import type { ProjectPublishMode } from '@/types/project-inventory'
import type { ListingAccessUserContext } from '@/lib/listingOwnership'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

export function isAdminRole(role: string): boolean {
  return role === 'master_admin' || role === 'admin'
}

export function isProfessionalRole(role: string): boolean {
  return role === 'broker' || role === 'agent' || role === 'constructora'
}

export function isPublicProjectMode(mode: unknown): boolean {
  return mode === 'public_market' || mode === 'multi_broker'
}

export function isProjectOwner(project: Record<string, unknown>, context: ListingAccessUserContext): boolean {
  const ownerCandidates = [
    safeText(project.developerId),
    safeText(project.ownerId),
    safeText(project.constructoraId),
    safeText(project.companyId),
  ].filter(Boolean)

  const scopedCodes = [safeText(context.uid), safeText(context.constructoraCode), safeText(context.professionalCode)].filter(Boolean)
  return ownerCandidates.some((owner) => scopedCodes.includes(owner))
}

export function canReadProject(project: Record<string, unknown>, context: ListingAccessUserContext): boolean {
  if (isAdminRole(context.role)) return true

  if (context.role === 'constructora') {
    return isProjectOwner(project, context)
  }

  if (context.role === 'broker' || context.role === 'agent') {
    const projectBrokerageId = safeText(project.brokerageId)
    if (context.officeId && projectBrokerageId && projectBrokerageId === context.officeId) {
      return true
    }
    return isPublicProjectMode(project.publishMode)
  }

  return false
}

export function canManageProject(project: Record<string, unknown>, context: ListingAccessUserContext): boolean {
  if (isAdminRole(context.role)) return true
  if (context.role === 'constructora') return isProjectOwner(project, context)
  return false
}

export function normalizePublishMode(value: unknown): ProjectPublishMode {
  if (value === 'public_market') return 'public_market'
  if (value === 'multi_broker') return 'multi_broker'
  return 'private_office'
}
