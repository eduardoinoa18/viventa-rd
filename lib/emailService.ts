import nodemailer from 'nodemailer'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, from, replyTo }: EmailOptions): Promise<void> {
  const fromEmail = from || process.env.SMTP_FROM || process.env.SENDGRID_FROM_EMAIL || 'noreply@viventa.com'
  // Format with friendly sender name for better email client display
  const fromFormatted = `VIVENTA <${fromEmail}>`

  // Try SendGrid first
  if (process.env.SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to,
        from: fromFormatted,
        subject,
        html,
        replyTo,
      })
      console.log(`Email sent via SendGrid to ${to}`)
      return
    } catch (error) {
      console.error('SendGrid error, falling back to SMTP:', error)
    }
  }

  // Fallback to SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const trySend = async (overrideFrom?: string) => {
      await transporter.sendMail({
        from: overrideFrom ? `VIVENTA <${overrideFrom}>` : fromFormatted,
        to,
        subject,
        html,
        replyTo,
      })
    }

    try {
      await trySend()
      console.log(`Email sent via SMTP to ${to} (from ${fromEmail})`)
      return
    } catch (smtpErr: any) {
      // Common issue: Gmail SMTP forbids arbitrary From. Retry with SMTP_USER
      const smtpUser = process.env.SMTP_USER
      const host = process.env.SMTP_HOST || ''
      const isGmail = /gmail\.com$/i.test(host) || /@gmail\.com$/i.test(String(smtpUser))
      const mismatch = smtpUser && fromEmail && smtpUser.toLowerCase() !== fromEmail.toLowerCase()
      if (isGmail && mismatch) {
        try {
          console.warn('SMTP from mismatch detected. Retrying with SMTP_USER as From...')
          await trySend(smtpUser!)
          console.log(`Email sent via SMTP to ${to} (from ${smtpUser}) with replyTo=${replyTo || 'none'}`)
          return
        } catch (retryErr) {
          console.error('SMTP retry with SMTP_USER failed:', retryErr)
          throw retryErr
        }
      }
      console.error('SMTP send failed:', smtpErr)
      throw smtpErr
    }
  }

  // No email service configured
  console.warn('No email service configured. Email not sent:', { to, subject })
  throw new Error('No email service configured')
}
