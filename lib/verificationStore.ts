// Shared verification store using global to persist across hot reloads in development
// In production, use Redis or a database

type VerificationData = {
  code: string;
  expiresAt: number;
  attempts: number;
}

// Use global to maintain state across hot reloads
const globalForVerification = global as typeof globalThis & {
  verificationCodes: Map<string, VerificationData>
}

if (!globalForVerification.verificationCodes) {
  globalForVerification.verificationCodes = new Map<string, VerificationData>()
}

export const verificationCodes = globalForVerification.verificationCodes
