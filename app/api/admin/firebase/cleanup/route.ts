import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin'
import { rateLimit, keyFromRequest } from '@/lib/rateLimiter'
import { requireMasterAdmin } from '@/lib/adminApiAuth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const guard = requireMasterAdmin(req)
    if (guard) return guard

    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DB_CLEANUP !== 'true') {
      return NextResponse.json({ ok: false, error: 'Database cleanup disabled in production' }, { status: 403 })
    }

    const key = keyFromRequest(req, 'firebase-cleanup')
    const { allowed } = rateLimit(key, 1, 60 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded. Cleanup can only run once per hour.' }, { status: 429 })
    }

    const { confirmation, collections, deleteAuth } = await req.json()
    
    // Admin identity must come from verified session cookie, not request body
    const adminEmail = req.cookies.get('viventa_admin_email')?.value
    if (!adminEmail) {
      return NextResponse.json({ ok: false, error: 'Admin email not found in session' }, { status: 401 })
    }

    if (confirmation !== 'DELETE_ALL_TEST_DATA_PERMANENTLY') {
      return NextResponse.json({ ok: false, error: 'Invalid confirmation' }, { status: 403 })
    }

    const db = getAdminDb()
    const auth = getAdminAuth()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 500 })
    }

    const results: Record<string, number> = {}
    const errors: string[] = []

    const targetCollections = Array.isArray(collections) && collections.length
      ? collections
      : ['users', 'properties', 'applications', 'agents', 'brokers', 'leads', 'conversations', 'messages', 'notifications', 'drafts']

    for (const collectionName of targetCollections) {
      try {
        const snapshot = await db.collection(collectionName).get()
        const batch = db.batch()
        let count = 0
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref)
          count++
        })
        if (count > 0) {
          await batch.commit()
        }
        results[collectionName] = count
      } catch (e: any) {
        results[collectionName] = -1
        errors.push(`${collectionName}: ${e.message}`)
      }
    }

    if (deleteAuth && auth) {
      try {
        const listUsersResult = await auth.listUsers(1000)
        let authCount = 0
        for (const user of listUsersResult.users) {
          // Skip admin/master accounts and the actor performing cleanup
          if (user.email && (user.email.includes('admin@') || user.email.includes('master@') || user.email === adminEmail)) {
            continue
          }
          try {
            await auth.deleteUser(user.uid)
            authCount++
          } catch (e) {
            console.error(`Failed to delete auth user ${user.uid}`, e)
          }
        }
        results.auth_users = authCount
      } catch (e: any) {
        results.auth_users = -1
        errors.push(`auth_users: ${e.message}`)
      }
    }

    await db.collection('audit_logs').add({
      actorId: adminEmail || null,
      actorRole: 'master_admin',
      action: 'firebase_cleanup',
      target: 'firebase',
      metadata: {
        results,
        collections: targetCollections,
        deleteAuth: !!deleteAuth,
        errors: errors.length ? errors : undefined,
        userAgent: req.headers.get('user-agent') || null
      },
      createdAt: new Date()
    })

    return NextResponse.json({
      ok: true,
      message: 'Firebase cleanup completed',
      results,
      errors: errors.length ? errors : undefined,
      totalDeleted: Object.values(results).reduce((sum, count) => sum + (count > 0 ? count : 0), 0)
    })
  } catch (error: any) {
    console.error('Firebase cleanup error:', error)
    return NextResponse.json({ ok: false, error: error.message || 'Firebase cleanup failed' }, { status: 500 })
  }
}
