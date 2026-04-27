/**
 * Middleware-safe session validation
 * Verifies session cookie signature (JWT-based)
 * Edge runtime compatible
 */

import { NextRequest } from 'next/server'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export interface MiddlewareSession {
  uid: string
  email: string
  role: string
  twoFactorVerified: boolean
}

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

function getProjectId(): string | null {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    null
  )
}

/**
 * Verifies and decodes session cookie in middleware (edge runtime)
 */
export async function getMiddlewareSession(
  req: NextRequest
): Promise<MiddlewareSession | null> {
  const sessionCookie = req.cookies.get('__session')?.value
  
  if (!sessionCookie) {
    return null
  }

  const projectId = getProjectId()
  if (!projectId) {
    console.error('Missing Firebase project id for middleware session verification')
    return null
  }

  try {
    const { payload } = await jwtVerify(sessionCookie, GOOGLE_JWKS, {
      algorithms: ['RS256'],
      issuer: `https://session.firebase.google.com/${projectId}`,
      audience: projectId,
    })

    const uid = String(payload.sub || payload.uid || '').trim()
    if (!uid) {
      return null
    }

    return {
      uid,
      email: String(payload.email || ''),
      role: String(payload.role || 'buyer'),
      twoFactorVerified: payload.twoFactorVerified === true,
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return null
  }
}
    )

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null
    }

    return {
      uid: payload.sub || payload.uid,
      email: payload.email || '',
      role: payload.role || 'buyer',
      twoFactorVerified: payload.twoFactorVerified === true,
    }
  } catch (error) {
    console.error('Session decode error:', error)
    return null
  }
}
