/**
 * Centralized logging system for VIVENTA
 * Replaces console.log/error statements throughout the app
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: any
  userId?: string
  context?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProd = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      context: typeof window !== 'undefined' ? window.location.pathname : 'server'
    }
  }

  private async sendToMonitoring(entry: LogEntry) {
    if (!this.isProd) return

    // In production, send errors to monitoring service
    // TODO: Integrate with Sentry, LogRocket, or DataDog
    if (entry.level === 'error') {
      try {
        // For now, just log to console in production
        // Replace with actual monitoring service
        console.error('[MONITORING]', entry)
      } catch (err) {
        // Silent fail to prevent logging errors from breaking app
      }
    }
  }

  info(message: string, data?: any) {
    const entry = this.formatMessage('info', message, data)
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, data || '')
    }
  }

  warn(message: string, data?: any) {
    const entry = this.formatMessage('warn', message, data)
    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, data || '')
    }
    this.sendToMonitoring(entry)
  }

  error(message: string, error?: any) {
    const entry = this.formatMessage('error', message, error)
    console.error(`❌ [ERROR] ${message}`, error || '')
    this.sendToMonitoring(entry)
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      const entry = this.formatMessage('debug', message, data)
      console.log(`🔍 [DEBUG] ${message}`, data || '')
    }
  }

  // Special methods for tracking user actions
  userAction(action: string, userId?: string, data?: any) {
    this.info(`User action: ${action}`, { userId, ...data })
  }

  apiCall(endpoint: string, method: string, status?: number, error?: any) {
    if (error) {
      this.error(`API ${method} ${endpoint} failed`, { status, error })
    } else {
      this.debug(`API ${method} ${endpoint}`, { status })
    }
  }
}

export const logger = new Logger()
