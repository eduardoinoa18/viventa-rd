// app/api/auth/send-master-code/route.ts
// Ensure Node.js runtime (required for Nodemailer/SendGrid in production)
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { verificationCodes } from '@/lib/verificationStore'
import sgMail from '@sendgrid/mail'
import nodemailer from 'nodemailer'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simple rate limiting (in-memory, per-email)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const limit = rateLimitMap.get(email)
  
  if (!limit || now > limit.resetAt) {
    // Reset or first request
    rateLimitMap.set(email, { count: 1, resetAt: now + 5 * 60 * 1000 }) // 5 min window
    return { allowed: true }
  }
  
  if (limit.count >= 3) {
    // Max 3 requests per 5 minutes
    return { allowed: false, retryAfter: Math.ceil((limit.resetAt - now) / 1000) }
  }
  
  limit.count++
  return { allowed: true }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const cookieHeader = request.headers.get('cookie') || ''
    const pwOk = cookieHeader.match(/(?:^|;\s*)admin_pw_ok=([^;]+)/)?.[1] || ''
    const pwEmail = cookieHeader.match(/(?:^|;\s*)admin_pw_email=([^;]+)/)?.[1] || ''

    // Build allowed email list: prefer MASTER_ADMIN_EMAILS (comma-separated), fallback to MASTER_ADMIN_EMAIL
    const rawList = (process.env.MASTER_ADMIN_EMAILS || process.env.MASTER_ADMIN_EMAIL || 'viventa.rd@gmail.com')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
    const allowedEmails = new Set(rawList)
    
    const incoming = String(email || '').trim().toLowerCase()
  const isDev = process.env.NODE_ENV !== 'production'
  const host = (request.headers.get('host') || '').toLowerCase()
  const isLocalHost = host.includes('localhost') || host.startsWith('127.0.0.1') || host.endsWith('.local')
    const allowAny = process.env.ALLOW_ANY_MASTER_EMAIL === 'true'
    
    // In development, allow any email. In production, check allowlist or ALLOW_ANY_MASTER_EMAIL flag
    const isAllowed = isDev || allowAny || allowedEmails.has(incoming)
    
    // Security: Don't log sensitive data in production
    if (isDev) {
      console.log('═══ Master Admin Login Attempt ═══')
      console.log('Email:', incoming)
      console.log('Allowlist:', Array.from(allowedEmails))
      console.log('Dev mode:', isDev)
      console.log('Allow any:', allowAny)
      console.log('Is allowed:', isAllowed)
    }

    if (!isAllowed) {
      // Security: Use generic error message to prevent email enumeration
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 403 })
    }

    if (pwOk !== '1' || (pwEmail && pwEmail.toLowerCase() !== incoming)) {
      return NextResponse.json({ ok: false, error: 'Password verification required' }, { status: 401 })
    }

    // Rate limiting (only in production)
    if (!isDev && !isLocalHost) {
      const rateCheck = checkRateLimit(incoming)
      if (!rateCheck.allowed) {
        return NextResponse.json({ 
          ok: false, 
          error: `Too many requests. Please try again in ${rateCheck.retryAfter} seconds.` 
        }, { status: 429 })
      }
    }

    // Generate 6-digit code
    const code = generateCode()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store code
  // Always key by lowercased email to avoid casing mismatches
  verificationCodes.set(incoming, { code, expiresAt, attempts: 0 })

    // Send email
    console.log('📧 Attempting to send verification email to:', incoming)
    const emailSent = await sendVerificationEmail(incoming, code)
    console.log('📧 Email send result:', emailSent ? '✅ SUCCESS' : '❌ FAILED')

    // If sending fails in development, still allow sign-in by surfacing the code
    if (!emailSent) {
      const allowDevResponse = isDev || isLocalHost || process.env.ALLOW_DEV_2FA_RESPONSE === 'true'
      if (allowDevResponse) {
        console.log('⚠️  Email failed but DEV mode - returning code in response')
        return NextResponse.json({ 
          ok: true, 
          message: 'Verification code (DEV) ready. Email sending is not configured.',
          expiresIn: 600,
          devCode: code
        })
      }
      console.error('❌ Email failed in production mode')
      return NextResponse.json({ 
        ok: false, 
        error: 'Email provider error. Please check SENDGRID or SMTP credentials.' 
      }, { status: 500 })
    }

    // Success
    console.log('✅ Verification code successfully sent and stored')
    const response: any = { 
      ok: true, 
      message: 'Verification code sent to your email',
      expiresIn: 600 // seconds
    }
    // Helpful for development and staging
    if (isDev || isLocalHost || process.env.ALLOW_DEV_2FA_RESPONSE === 'true') {
      response.devCode = code
      console.log('🔐 DEV CODE:', code)
    }
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error sending verification code:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    console.log('📧 Attempting to send email to:', email)
    console.log('📧 SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY)
    console.log('📧 SMTP_HOST exists:', !!process.env.SMTP_HOST)

    // Option 1: Using SendGrid (recommended for production)
    if (process.env.SENDGRID_API_KEY) {
      console.log('📧 Using SendGrid...')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)

      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@viventa.com',
        replyTo: 'no-reply@viventa.com', // Prevent replies
        subject: 'VIVENTA Master Admin - Verification Code',
        text: `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0B2545 0%, #00A676 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">VIVENTA</h1>
              <p style="color: white; margin: 10px 0 0 0;">Master Admin Verification</p>
            </div>
            <div style="padding: 40px 30px; background: #f9f9f9;">
              <h2 style="color: #0B2545; margin-top: 0;">Your Verification Code</h2>
              <p style="color: #666; line-height: 1.6;">Enter this code to complete your Master Admin login:</p>
              <div style="background: white; border: 2px solid #00A676; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #0B2545; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                This code will expire in <strong>10 minutes</strong>.<br>
                If you did not request this code, please ignore this email.
              </p>
            </div>
            <div style="background: #0B2545; padding: 20px; text-align: center; color: #fff; font-size: 12px;">
              © ${new Date().getFullYear()} VIVENTA. All rights reserved.
            </div>
          </div>
        `
      }

      const result = await sgMail.send(msg)
      console.log('✅ SendGrid email sent successfully:', result)
      return true
    }

    // Option 2: Using Nodemailer (for development/testing)
    if (process.env.SMTP_HOST) {
      console.log('📧 Using SMTP/Nodemailer...')
      console.log('📧 SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? '***' : 'missing',
        pass: process.env.SMTP_PASS ? '***' : 'missing',
      })

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      const info = await transporter.sendMail({
        from: {
          name: 'VIVENTA Security',
          address: process.env.SMTP_FROM || 'noreply@viventa.com'
        },
        to: email,
        replyTo: 'no-reply@viventa.com', // Prevent replies
        subject: 'VIVENTA Master Admin - Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0B2545 0%, #00A676 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">VIVENTA</h1>
              <p style="color: white; margin: 10px 0 0 0;">Master Admin Verification</p>
            </div>
            <div style="padding: 40px 30px; background: #f9f9f9;">
              <h2 style="color: #0B2545; margin-top: 0;">Your Verification Code</h2>
              <p style="color: #666; line-height: 1.6;">Enter this code to complete your Master Admin login:</p>
              <div style="background: white; border: 2px solid #00A676; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #0B2545; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                This code will expire in <strong>10 minutes</strong>.<br>
                If you did not request this code, please ignore this email.
              </p>
            </div>
          </div>
        `
      })

      console.log('✅ SMTP email sent successfully:', info.messageId)
      return true
    }

    // No email service configured - throw error
    console.error('❌ No email service configured!')
    console.error('Please set either SENDGRID_API_KEY or SMTP credentials in .env.local')
    console.error('Development fallback (console only):')
    console.log('═══════════════════════════════════════')
    console.log('📧 MASTER ADMIN VERIFICATION CODE')
    console.log('═══════════════════════════════════════')
    console.log(`Email: ${email}`)
    console.log(`Code: ${code}`)
    console.log(`Expires: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString()}`)
    console.log('═══════════════════════════════════════')
    
    // Return false to indicate email was NOT sent
    return false

  } catch (error) {
    console.error('❌ Email send error:', error)
    return false
  }
}
