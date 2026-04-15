/**
 * VIVENTA Contact Constants
 *
 * All buyer-facing communication is routed through VIVENTA's central
 * control number and email. Leads are captured first, then assigned
 * to agents/brokers as referrals via the master admin dashboard.
 *
 * NEVER expose the raw gmail address to end users — use VIVENTA_EMAIL_DISPLAY.
 * The actual delivery address (VIVENTA_EMAIL_TO) is server-only and used
 * only in sendEmail() calls.
 */

/** E.164 format for wa.me links (no +) */
export const VIVENTA_PHONE_E164 = '19783905523'

/** Human-readable display number */
export const VIVENTA_PHONE_DISPLAY = '+1 (978) 390-5523'

/** Pre-built WhatsApp base URL — append ?text= to add a message */
export const VIVENTA_WHATSAPP_BASE = `https://wa.me/${VIVENTA_PHONE_E164}`

/**
 * Build a WhatsApp URL that routes to VIVENTA's central number.
 * @param message  Optional pre-filled message text (plain string, will be encoded)
 */
export function buildWhatsAppUrl(message?: string): string {
  if (!message) return VIVENTA_WHATSAPP_BASE
  return `${VIVENTA_WHATSAPP_BASE}?text=${encodeURIComponent(message)}`
}

/**
 * Build a WhatsApp message for a property inquiry.
 * Keeps the same conversational tone used throughout the platform.
 */
export function buildPropertyWhatsAppMessage(propertyTitle?: string, propertyId?: string): string {
  const title = propertyTitle ? `"${propertyTitle}"` : 'una propiedad publicada en VIVENTA'
  const ref = propertyId ? ` (Ref: ${propertyId})` : ''
  return `Hola VIVENTA, me interesa ${title}${ref}. ¿Pueden darme más información?`
}

/**
 * The public-facing email address shown in emails, UI, and footers.
 * Masking: appears as info@viventa.com but delivers to VIVENTA_EMAIL_TO.
 */
export const VIVENTA_EMAIL_DISPLAY = 'info@viventa.com'

/**
 * The actual delivery address for all inbound email.
 * Use ONLY on the server (API routes, Cloud Functions).
 * Never expose this in client-facing JSX or email body text.
 */
export const VIVENTA_EMAIL_TO = process.env.MASTER_ADMIN_EMAIL || 'viventa.rd@gmail.com'

/**
 * "From" name shown in outgoing emails.
 */
export const VIVENTA_EMAIL_FROM_NAME = 'VIVENTA'

/**
 * No physical location yet. Renders a small placeholder in email footers.
 */
export const VIVENTA_ADDRESS_LINE = 'República Dominicana'
