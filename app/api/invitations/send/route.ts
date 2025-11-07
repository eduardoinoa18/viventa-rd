// app/api/invitations/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { sendEmail } from '@/lib/emailService'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Generate a secure random token
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// POST - Send invitation
export async function POST(request: NextRequest) {
  try {
    const { email, name, message, inviteType } = await request.json()

    if (!email || !name || !inviteType) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate invite type
    if (!['agent', 'broker', 'user'].includes(inviteType)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid invite type' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Check if email already exists in users
    const existingUserSnap = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!existingUserSnap.empty) {
      return NextResponse.json(
        { ok: false, error: 'This email is already registered in the system' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation for this email
    const existingInviteSnap = await adminDb
      .collection('invitations')
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .limit(1)
      .get()

    if (!existingInviteSnap.empty) {
      return NextResponse.json(
        { ok: false, error: 'A pending invitation already exists for this email' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = generateInviteToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

    // Create invitation record
    const invitationData = {
      email,
      name,
      message: message || '',
      inviteType,
      token,
      status: 'pending',
      createdAt: new Date(),
      expiresAt,
      acceptedAt: null,
    }

    const inviteRef = await adminDb.collection('invitations').add(invitationData)

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/auth/invite/${token}`

    // Prepare email content based on invite type
    const roleLabel =
      inviteType === 'agent'
        ? 'Real Estate Agent'
        : inviteType === 'broker'
        ? 'Broker'
        : 'User'

    const emailSubject = `You're Invited to Join VIVENTA as a ${roleLabel}`
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0B2545 0%, #134074 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #00A676 0%, #00C896 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .message-box { background: white; border-left: 4px solid #00A676; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .role-badge { display: inline-block; background: #00A676; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 VIVENTA</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">República Dominicana's Premier Real Estate Platform</p>
            </div>
            
            <div class="content">
              <h2>Hi ${name}! 👋</h2>
              
              <p>You've been invited to join <strong>VIVENTA</strong> as a <span class="role-badge">${roleLabel}</span></p>
              
              ${
                message
                  ? `
              <div class="message-box">
                <strong>Personal Message:</strong>
                <p style="margin: 10px 0 0 0;">${message}</p>
              </div>
              `
                  : ''
              }
              
              <p><strong>What's next?</strong></p>
              <ul>
                <li>Click the button below to accept your invitation</li>
                <li>Complete your ${inviteType === 'user' ? 'profile' : 'professional application'}</li>
                <li>Start ${
                  inviteType === 'user'
                    ? 'exploring properties'
                    : 'building your real estate business'
                }</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">Accept Invitation & Get Started</a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>⏰ This invitation expires in 7 days</strong><br/>
                If you can't click the button, copy and paste this link:<br/>
                <code style="background: #e0e0e0; padding: 5px 10px; border-radius: 5px; font-size: 12px;">${inviteLink}</code>
              </p>
              
              ${
                inviteType !== 'user'
                  ? `
              <div style="background: #e8f5f1; border: 1px solid #00A676; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <strong>Why Join VIVENTA?</strong>
                <ul style="margin: 10px 0 0 0;">
                  <li>Access to premium tools and resources</li>
                  <li>Connect with qualified buyers and sellers</li>
                  <li>Professional profile and listing management</li>
                  <li>Analytics and performance tracking</li>
                  <li>Growing network of real estate professionals</li>
                </ul>
              </div>
              `
                  : ''
              }
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} VIVENTA - República Dominicana</p>
              <p>This is an automated invitation email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send invitation email
    try {
      await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml,
      })
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({
      ok: true,
      inviteLink,
      invitationId: inviteRef.id,
      message: 'Invitation sent successfully',
    })
  } catch (error: any) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
