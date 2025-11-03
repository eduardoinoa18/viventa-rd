import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, interest } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Database not available' }, { status: 500 })
    }

    // Save waitlist entry to database (using waitlist_social collection for admin portal compatibility)
    await adminDb.collection('waitlist_social').add({
      name,
      email,
      phone: phone || '',
      interest,
      createdAt: Timestamp.now(),
      status: 'pending',
      source: 'popup',
      readBy: []
    })

    // Create admin notification
    await adminDb.collection('notifications').add({
      type: 'waitlist_submission',
      title: '🎯 New Waitlist Signup',
      message: `${name} (${email}) joined the waitlist as ${interest}`,
      createdAt: Timestamp.now(),
      audience: ['master_admin', 'admin'],
      readBy: [],
      metadata: {
        name,
        email,
        phone,
        interest
      }
    })

    // Send email notification to admin (optional - requires email service setup)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: process.env.ADMIN_EMAIL || process.env.MASTER_ADMIN_EMAIL || 'viventa.rd@gmail.com',
          from: 'noreply@viventa.com',
          replyTo: email,
          subject: `🎯 New Waitlist Signup - ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(to right, #004AAD, #00A676); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">New Waitlist Signup! 🎉</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #0B2545; margin-top: 0;">Contact Details</h2>
                <table style="width: 100%; background: white; border-radius: 8px; padding: 20px;">
                  <tr>
                    <td style="padding: 10px; font-weight: bold; color: #666;">Name:</td>
                    <td style="padding: 10px; color: #333;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; color: #666;">Email:</td>
                    <td style="padding: 10px; color: #333;"><a href="mailto:${email}" style="color: #00A676;">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; color: #666;">Phone:</td>
                    <td style="padding: 10px; color: #333;">${phone || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; color: #666;">Interest:</td>
                    <td style="padding: 10px; color: #333;">${interest}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; color: #666;">Submitted:</td>
                    <td style="padding: 10px; color: #333;">${new Date().toLocaleString('es-DO')}</td>
                  </tr>
                </table>
                <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 4px;">
                  <p style="margin: 0; color: #0B2545;">
                    <strong>📊 Quick Action:</strong> View all waitlist submissions in your 
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/chat?tab=waitlist" style="color: #00A676;">Admin Portal</a>
                  </p>
                </div>
              </div>
              <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
                <p>This is an automated notification from VIVENTA Platform</p>
              </div>
            </div>
          `
        })
      })
    } catch (emailError) {
      console.error('Email notification failed:', emailError)
      // Don't fail the request if email fails
    }

    // Send confirmation email to user
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          from: 'noreply@viventa.com',
          replyTo: process.env.ADMIN_EMAIL || process.env.MASTER_ADMIN_EMAIL || 'viventa.rd@gmail.com',
          subject: '🎉 Welcome to the VIVENTA Waitlist!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(to right, #004AAD, #00A676); padding: 40px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 32px;">You're In! 🚀</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Welcome to the VIVENTA Community</p>
              </div>
              <div style="padding: 40px; background: white;">
                <h2 style="color: #0B2545; margin-top: 0;">Hola ${name}! 👋</h2>
                <p style="color: #333; line-height: 1.6; font-size: 16px;">
                  Thank you for joining the VIVENTA waitlist! We're thrilled to have you as part of our early community.
                </p>
                
                <div style="background: #f0f9ff; border-left: 4px solid #00A676; padding: 20px; margin: 25px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 15px 0; color: #0B2545;">What happens next?</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #333;">
                    <li style="margin-bottom: 10px;"><strong>Regular Updates:</strong> We'll keep you posted on our development progress</li>
                    <li style="margin-bottom: 10px;"><strong>Early Beta Access:</strong> You'll be first in line to test new features</li>
                    <li style="margin-bottom: 10px;"><strong>Launch Perks:</strong> Exclusive benefits when we go live</li>
                    <li style="margin-bottom: 10px;"><strong>Your Voice Matters:</strong> Help shape the platform with your feedback</li>
                  </ul>
                </div>

                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
                  <p style="color: white; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">Your Waitlist Position</p>
                  <p style="color: white; margin: 0; font-size: 14px; opacity: 0.9;">You're among our earliest supporters! 🌟</p>
                </div>

                <p style="color: #333; line-height: 1.6;">
                  We're building something special for the Dominican real estate market, and your early support means the world to us.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}" 
                     style="display: inline-block; background: linear-gradient(to right, #004AAD, #00A676); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Visit VIVENTA
                  </a>
                </div>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  Questions? Just reply to this email - we'd love to hear from you!
                </p>
              </div>
              <div style="padding: 20px; text-align: center; background: #f9f9f9; color: #666; font-size: 12px;">
                <p style="margin: 0 0 10px 0;">VIVENTA - Tu Espacio, Tu Futuro</p>
                <p style="margin: 0;">Santo Domingo, República Dominicana</p>
              </div>
            </div>
          `
        })
      })
    } catch (confirmEmailError) {
      console.error('Confirmation email failed:', confirmEmailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ ok: true, message: 'Waitlist submission successful' })
  } catch (error) {
    console.error('Waitlist notification error:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
