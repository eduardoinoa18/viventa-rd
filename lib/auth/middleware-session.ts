/**
 * Middleware-safe session validation
 * Does NOT import Firebase Admin SDK (edge runtime compatible)
 * Just decodes and validates JWT structure
 */

import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export interface MiddlewareSession {
  uid: string
  email: string
  role: string
  twoFactorVerified: boolean
}

/**
 * Validates session cookie in middleware (edge runtime)
 * Uses jose library for JWT verification (edge-compatible)
 */
export async function getMiddlewareSession(
  req: NextRequest
): Promise<MiddlewareSession | null> {
  const sessionCookie = req.cookies.get('__session')?.value
  
  if (!sessionCookie) {
    return null
  }

  try {
    // Get Firebase project ID from environment
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (!projectId) {
      console.error('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID')
      return null
    }

    // Verify JWT using Firebase's public keys
    // Firebase session cookies are JWTs signed by Firebase
    const { payload } = await jwtVerify(
      sessionCookie,
      // Firebase uses RS256 with public keys at this URL
      async () => {
        const response = await fetch(
          `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`
        )
        const jwks = await response.json()
        return jwks
      },
      {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      }
    )

    // Extract custom claims
    const role = payload.role as string
    const twoFactorVerified = payload.twoFactorVerified as boolean

    return {
      uid: payload.sub as string,
      email: payload.email as string,
      role: role || 'buyer',
      twoFactorVerified: twoFactorVerified ?? false,
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}
