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
}

export async function sendEmail({ to, subject, html, from }: EmailOptions): Promise<void> {
  const fromEmail = from || process.env.SMTP_FROM || process.env.SENDGRID_FROM_EMAIL || 'noreply@viventa.com'

  // Try SendGrid first
  if (process.env.SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to,
        from: fromEmail,
        subject,
        html,
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

    await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
    })
    console.log(`Email sent via SMTP to ${to}`)
    return
  }

  // No email service configured
  console.warn('No email service configured. Email not sent:', { to, subject })
  throw new Error('No email service configured')
}
