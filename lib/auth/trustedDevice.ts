/**
 * Trusted Device Token Verification
 * HMAC-SHA256 signed tokens for "remember this device" functionality
 */

/**
 * Convert base64url to Uint8Array
 */
function b64urlToUint8(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4
  if (pad) b64 += '='.repeat(4 - pad)
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

/**
 * Verify trusted device token (header.payload.signature format)
 * @param token - JWT-like token with HMAC-SHA256 signature
 * @param secret - Secret key for HMAC verification
 * @returns true if valid and not expired, false otherwise
 */
export async function verifyTrustedToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false

    const [h, p, s] = parts
    const data = `${h}.${p}`
    const sig = b64urlToUint8(s)

    // Import secret key for HMAC verification
    const secretBuf = new TextEncoder().encode(secret).buffer as ArrayBuffer
    const key = await crypto.subtle.importKey(
      'raw',
      secretBuf,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // Verify signature
    const sigBuf = sig.buffer as ArrayBuffer
    const dataBuf = new TextEncoder().encode(data).buffer as ArrayBuffer
    const verified = await crypto.subtle.verify('HMAC', key, sigBuf, dataBuf)

    if (!verified) return false

    // Check expiration
    const payloadJson = new TextDecoder().decode(b64urlToUint8(p))
    const payload = JSON.parse(payloadJson)

    if (!payload || typeof payload !== 'object') return false
    if (typeof payload.exp !== 'number') return false

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return false

    return true
  } catch {
    return false
  }
}
