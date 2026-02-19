/**
 * Admin Diagnostics API
 * System health check endpoint
 * Minimal implementation to prevent 404 errors
 */

import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    // Verify master admin session
    const session = await getServerSession()
    
    if (!session || session.role !== 'master_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Basic system diagnostics
    const diagnostics = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      services: {
        firebase: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'configured' : 'missing',
        auth: session ? 'authenticated' : 'unauthenticated',
      },
      // TODO: Add more comprehensive health checks in Phase 2
      // - Firestore connection
      // - Storage availability
      // - Email service status
      // - Search index health
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error('Diagnostics error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to fetch diagnostics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
