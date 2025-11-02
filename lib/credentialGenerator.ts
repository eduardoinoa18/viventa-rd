/**
 * Automatic credential generation for agents and brokers
 * Format: A##### for agents, B##### for brokers
 */

import { db } from './firebaseClient'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

export type ProfessionalType = 'agent' | 'broker'

/**
 * Generate unique professional ID
 * @param type - 'agent' or 'broker'
 * @returns Unique ID (e.g., A00001, B00001)
 */
export async function generateProfessionalId(type: ProfessionalType): Promise<string> {
  const prefix = type === 'agent' ? 'A' : 'B'
  
  try {
    // Get the last credential for this type
    const credentialsRef = collection(db, 'professional_credentials')
    const q = query(
      credentialsRef,
      where('type', '==', type),
      orderBy('number', 'desc'),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    
    let nextNumber = 1
    if (!snapshot.empty) {
      const lastCredential = snapshot.docs[0].data()
      nextNumber = (lastCredential.number || 0) + 1
    }
    
    // Format with leading zeros (5 digits)
    const paddedNumber = nextNumber.toString().padStart(5, '0')
    return `${prefix}${paddedNumber}`
  } catch (error) {
    console.error('Error generating credential:', error)
    // Fallback to timestamp-based ID if query fails
    const timestamp = Date.now().toString().slice(-5)
    return `${prefix}${timestamp}`
  }
}

/**
 * Generate temporary password for email (user will change it)
 * @returns 12-character secure password
 */
export function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%'
  
  const allChars = uppercase + lowercase + numbers + special
  let password = ''
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  // Fill remaining characters
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Create password reset token
 * @param userId - User ID
 * @returns Reset token
 */
export function createPasswordSetupToken(userId: string): string {
  // Create a JWT-like token for password setup
  const payload = {
    userId,
    type: 'password_setup',
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  }
  
  // Base64 encode (in production, use proper JWT signing)
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

/**
 * Verify password setup token
 * @param token - Reset token
 * @returns User ID if valid, null otherwise
 */
export function verifyPasswordSetupToken(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString())
    
    if (payload.type !== 'password_setup') return null
    if (payload.exp < Date.now()) return null
    
    return payload.userId
  } catch {
    return null
  }
}
