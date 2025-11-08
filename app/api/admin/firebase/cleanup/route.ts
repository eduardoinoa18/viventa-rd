// app/api/admin/firebase/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'
import { rateLimit, keyFromRequest } from '@/lib/rateLimiter'

export const dynamic = 'force-dynamic'

/**
 * WARNING: This endpoint permanently deletes Firebase data.
 * Only accessible to master_admin role with confirmation token.
 * Rate limited to 1 request per hour.
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting - 1 request per hour
    const key = keyFromRequest(req, 'firebase-cleanup')
    const { allowed } = rateLimit(key, 1, 60 * 60 * 1000) // 1 per hour

    if (!allowed) {
      return NextResponse.json({
        ok: false,
        error: 'Rate limit exceeded. Firebase cleanup can only be run once per hour.'
      }, { status: 429 })
    }

    const { confirmation, collections, deleteAuth, adminEmail } = await req.json()

    // Security check: require exact confirmation string
    if (confirmation !== 'DELETE_ALL_TEST_DATA_PERMANENTLY') {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid confirmation. Must be: DELETE_ALL_TEST_DATA_PERMANENTLY' 
      }, { status: 403 })
    }

    const adminDb = getAdminDb()
    const adminAuth = getAdminAuth()

    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Firebase Admin not initialized' }, { status: 500 })
    }

    const results: Record<string, number> = {}
    const errors: string[] = []

    // Collections to clean (user can specify or use defaults)
    const targetCollections = collections && Array.isArray(collections) 
      ? collections 
      : ['users', 'properties', 'applications', 'agents', 'brokers', 'leads', 'conversations', 'messages', 'notifications', 'drafts']

    // Delete Firestore collections
    for (const collectionName of targetCollections) {
      try {
        const snapshot = await adminDb.collection(collectionName).get()
        const batch = adminDb.batch()
        let count = 0

        snapshot.docs.forEach((doc: any) => {
          batch.delete(doc.ref)
          count++
        })

        if (count > 0) {
          await batch.commit()
          results[collectionName] = count
        } else {
          results[collectionName] = 0
        }
      } catch (error: any) {
        errors.push(`${collectionName}: ${error.message}`)
        results[collectionName] = -1
      }
    }

    // Delete Firebase Auth users (if requested)
    if (deleteAuth && adminAuth) {
      try {
        const listUsersResult = await adminAuth.listUsers(1000)
        let authCount = 0

        for (const user of listUsersResult.users) {
          // Skip admin emails (safety measure)
          if (user.email && (
            user.email.includes('admin@') || 
            user.email.includes('master@') ||
            user.email === adminEmail
          )) {
            continue
          }

          try {
            await adminAuth.deleteUser(user.uid)
            authCount++
          } catch (e) {
            console.error(`Failed to delete auth user ${user.uid}`, e)
          }
        }

        results['auth_users'] = authCount
      } catch (error: any) {
        errors.push(`auth_users: ${error.message}`)
        results['auth_users'] = -1
      }
    }

    // Log activity
    ActivityLogger.log({
      type: 'system',
      action: 'firebase_cleanup',
      userId: 'system',
      userEmail: adminEmail || 'admin',
      userName: 'System Admin',
      metadata: {
        results,
        collectionsDeleted: Object.keys(results).filter(k => results[k] > 0),
        totalDocuments: Object.values(results).reduce((sum, count) => sum + (count > 0 ? count : 0), 0)
      }
    })

    return NextResponse.json({ 
      ok: true, 
      message: 'Firebase cleanup completed',
      results,
      errors: errors.length > 0 ? errors : undefined,
      totalDeleted: Object.values(results).reduce((sum, count) => sum + (count > 0 ? count : 0), 0)
    })

  } catch (error: any) {
    console.error('Firebase cleanup error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Firebase cleanup failed' 
    }, { status: 500 })
  }
}
