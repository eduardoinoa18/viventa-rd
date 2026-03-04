/**
 * Structured Logging Utility
 * 
 * Provides consistent logging across frontend and backend with proper
 * error tracking, level-based filtering, and production-safe output.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   
 *   logger.debug('Component mounted', { userId: '123' })
 *   logger.info('User logged in', { email: 'user@example.com' })
 *   logger.warn('API rate limit approaching', { remaining: 10 })
 *   logger.error('Failed to save listing', error, { listingId: '456' })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Record<string, any>

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    message: string
    stack?: string
  }
}

const isDevelopment = process.env.NODE_ENV === 'development'

function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) return ''
  try {
    return JSON.stringify(context)
  } catch {
    return '[circular reference]'
  }
}

function formatError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
    }
  }
  return {
    message: String(error),
  }
}

function getCallerInfo(): string {
  if (!isDevelopment) return ''
  try {
    const stack = new Error().stack || ''
    const lines = stack.split('\n')
    const callerLine = lines[4]
    if (!callerLine) return ''
    const match = callerLine.match(/\(([^:]+):(\d+):/)
    if (match) {
      return `[${match[1].split('/').pop()}:${match[2]}]`
    }
  } catch {
    // Silently fail if we can't get caller info
  }
  return ''
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error: error ? formatError(error) : undefined,
  }
}

function output(entry: LogEntry): void {
  if (isDevelopment) {
    const caller = getCallerInfo()
    const prefix = `[${entry.level.toUpperCase()}] ${caller}`.trim()
    const contextStr = formatContext(entry.context)
    
      const args: any[] = [prefix, entry.message]
    if (contextStr) args.push(contextStr)
    if (entry.error) args.push(entry.error)
    
    switch (entry.level) {
      case 'debug':
        console.debug(...args)
        break
      case 'info':
        console.log(...args)
        break
      case 'warn':
        console.warn(...args)
        break
      case 'error':
        console.error(...args)
        break
    }
  } else {
    if (entry.level === 'warn' || entry.level === 'error') {
      console.log(JSON.stringify(entry))
    }
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      const entry = createLogEntry('debug', message, context)
      output(entry)
    }
  },

  info(message: string, context?: LogContext): void {
    const entry = createLogEntry('info', message, context)
    output(entry)
  },

  warn(message: string, context?: LogContext): void {
    const entry = createLogEntry('warn', message, context)
    output(entry)
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    const entry = createLogEntry('error', message, context, error)
    output(entry)
  },

  logApiCall(
    method: string,
    path: string,
    status: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = status >= 400 ? 'warn' : 'info'
    const message = `${method} ${path} ${status} (${duration}ms)`
    const entry = createLogEntry(level, message, context)
    output(entry)
  },

  logFirebaseOp(
    operation: string,
    collection: string,
    status: 'success' | 'error',
    context?: LogContext
  ): void {
    const level = status === 'error' ? 'error' : 'debug'
    const message = `Firebase ${operation} on ${collection}: ${status}`
    const entry = createLogEntry(level, message, context)
    output(entry)
  },

  logAuthEvent(
    action: string,
    userId?: string,
    context?: LogContext
  ): void {
    const message = `Auth: ${action}${userId ? ` for user ${userId}` : ''}`
    const entry = createLogEntry('info', message, context)
    output(entry)
  },
}

export function createErrorHandler(
  handler: (
    req: any,
    context: any
  ) => Promise<Response> | Response
) {
  return async (req: any, context?: any) => {
    try {
      return await handler(req, context)
    } catch (error) {
      logger.error(
        `API handler error: ${req.method} ${req.url}`,
        error,
        {
          method: req.method,
          url: req.url,
        }
      )
      throw error
    }
  }
}
