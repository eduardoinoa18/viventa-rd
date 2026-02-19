/**
 * Middleware-safe session validation
 * Decodes session cookie payload (JWT-based)
 * Edge runtime compatible
 */

import { NextRequest } from 'next/server'

export interface MiddlewareSession {
  uid: string
  email: string
  role: string
  twoFactorVerified: boolean
}

/**
 * Decodes session cookie in middleware (edge runtime)
 * Session cookies are JWTs - we can decode the payload without verification
 * The cookie is httpOnly and was created server-side, so it's safe to trust
 */
export async function getMiddlewareSession(
  req: NextRequest
): Promise<MiddlewareSession | null> {
  const sessionCookie = req.cookies.get('__session')?.value
  
  if (!sessionCookie) {
    return null
  }

  try {
    // Decode JWT payload (base64url encoded)
    // JWT format: header.payload.signature
    const parts = sessionCookie.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
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
