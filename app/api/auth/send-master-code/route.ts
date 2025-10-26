// app/api/auth/send-master-code/route.ts
import { NextResponse } from 'next/server'
import { verificationCodes } from '@/lib/verificationStore'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Build allowed email list: prefer MASTER_ADMIN_EMAILS (comma-separated), fallback to MASTER_ADMIN_EMAIL
    const rawList = (process.env.MASTER_ADMIN_EMAILS || process.env.MASTER_ADMIN_EMAIL || 'admin@viventa.com')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
    const allowedEmails = new Set(rawList)
    
    // Security: Don't log sensitive data in production
    if (process.env.NODE_ENV === 'development') {
      console.log('Login attempt for:', email)
    }
    
  const incoming = String(email || '').trim().toLowerCase()
    const isDev = process.env.NODE_ENV !== 'production'
    const allowAny = process.env.ALLOW_ANY_MASTER_EMAIL === 'true'
    const isAllowed = allowedEmails.has(incoming) || (isDev ? true : allowAny)

    // In development, do not enforce allowlist to reduce friction
    if (!isAllowed) {
      // Security: Use generic error message to prevent email enumeration
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 403 })
    }

    // Generate 6-digit code
    const code = generateCode()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store code
  // Always key by lowercased email to avoid casing mismatches
  verificationCodes.set(incoming, { code, expiresAt, attempts: 0 })

    // Send email
    const emailSent = await sendVerificationEmail(incoming, code)

    // If sending fails in development, still allow sign-in by surfacing the code
    if (!emailSent) {
      if (isDev || process.env.ALLOW_DEV_2FA_RESPONSE === 'true') {
        return NextResponse.json({ 
          ok: true, 
          message: 'Verification code (DEV) ready. Email sending is not configured.',
          expiresIn: 600,
          devCode: code
        })
      }
      return NextResponse.json({ 
        ok: false, 
        error: 'Email provider error. Please check SENDGRID or SMTP credentials.' 
      }, { status: 500 })
    }

    // Success
    const response: any = { 
      ok: true, 
      message: 'Verification code sent to your email',
      expiresIn: 600 // seconds
    }
    // Helpful for development and staging
    if (isDev || process.env.ALLOW_DEV_2FA_RESPONSE === 'true') {
      response.devCode = code
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
    // Option 1: Using SendGrid (recommended for production)
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = require('@sendgrid/mail')
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

      await sgMail.send(msg)
      return true
    }

    // Option 2: Using Nodemailer (for development/testing)
    if (process.env.SMTP_HOST) {
      const nodemailer = require('nodemailer')
      
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

      return true
    }

    // Development fallback - just log to console
    console.log('═══════════════════════════════════════')
    console.log('📧 MASTER ADMIN VERIFICATION CODE')
    console.log('═══════════════════════════════════════')
    console.log(`Email: ${email}`)
    console.log(`Code: ${code}`)
    console.log(`Expires: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString()}`)
    console.log('═══════════════════════════════════════')
    
    return true

  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}
