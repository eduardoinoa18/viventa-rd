// In-memory store for 2FA verification codes
// In production, use Redis or a database
export const verificationCodes = new Map<string, {
  code: string;
  expiresAt: number;
  attempts: number;
}>();
