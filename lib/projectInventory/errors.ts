export type ProjectInventoryErrorCode =
  | 'INVALID_PROJECT_STATUS'
  | 'INVALID_PROJECT_STATUS_TRANSITION'
  | 'INVALID_UNIT_STATUS'
  | 'INVALID_UNIT_STATUS_TRANSITION'
  | 'INVALID_RESERVATION_STATUS'
  | 'INVALID_RESERVATION_STATUS_TRANSITION'
  | 'INVALID_PUBLISH_MODE'
  | 'PROJECT_NOT_FOUND'
  | 'UNIT_NOT_FOUND'
  | 'RESERVATION_NOT_FOUND'
  | 'DUPLICATE_UNIT_CODE'
  | 'INVALID_PAYLOAD'
  | 'FIRESTORE_OPERATION_FAILED'

export class ProjectInventoryError extends Error {
  code: ProjectInventoryErrorCode
  status: number
  metadata?: Record<string, unknown>

  constructor(params: {
    code: ProjectInventoryErrorCode
    message: string
    status?: number
    metadata?: Record<string, unknown>
  }) {
    super(params.message)
    this.name = 'ProjectInventoryError'
    this.code = params.code
    this.status = params.status ?? 400
    this.metadata = params.metadata
  }
}

export function toProjectInventoryError(error: unknown, fallbackMessage: string): ProjectInventoryError {
  if (error instanceof ProjectInventoryError) {
    return error
  }

  return new ProjectInventoryError({
    code: 'FIRESTORE_OPERATION_FAILED',
    message: fallbackMessage,
    status: 500,
    metadata: {
      originalError: error instanceof Error ? error.message : String(error),
    },
  })
}
