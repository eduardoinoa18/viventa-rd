// app/api/admin/professionals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'
import { sendEmail } from '@/lib/emailService'
import { logActivity } from '@/lib/activityLogger'

// Generate a unique professional code
function generateProfessionalCode(role: string): string {
  const prefix = role === 'broker' ? 'BRK' : 'AGT'
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${random}`
}

// POST - Create a new professional (agent or broker)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      name,
      email,
      phone,
      role,
      licenseNumber,
      yearsExperience,
      specialties,
      languages,
      company,
      brokerage,
      officeAddress,
      website,
      bio,
      certifications,
    } = data

    // Validate required fields (license is optional for DR)
    if (!name || !email || !phone || !role || !yearsExperience) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate professional code
    const professionalCode = generateProfessionalCode(role)

    // Get Admin SDK instances
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not initialized' },
        { status: 500 }
      )
    }

    // Check if email already exists
    try {
      const existingUser = await adminAuth.getUserByEmail(email)
      if (existingUser) {
        return NextResponse.json(
          { ok: false, error: 'This email is already registered. Please use a different email address.' },
          { status: 400 }
        )
      }
    } catch (e: any) {
      // If user not found, that's good - we can proceed
      if (e.code !== 'auth/user-not-found') {
        console.error('Error checking existing user:', e)
      }
    }

    // Create Firebase Auth account with a temporary password
    const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    let userRecord
    try {
      userRecord = await adminAuth.createUser({
        email,
        password: tempPassword,
        displayName: name,
        phoneNumber: phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`, // Format phone
      })
    } catch (authError: any) {
      console.error('Firebase Auth error:', authError)
      
      // Better error messages
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { ok: false, error: 'This email is already registered. Please use a different email address.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { ok: false, error: `Failed to create account: ${authError.message}` },
        { status: 500 }
      )
    }

    // Create Firestore user document with professional details
    const userData = {
      uid: userRecord.uid,
      name,
      email,
      phone,
      role,
      professionalCode,
      
      // Professional details
      licenseNumber,
      yearsExperience,
      specialties: specialties || [],
      languages: languages || ['Spanish'],
      certifications: certifications || '',
      
      // Business info
      company: company || '',
      brokerage: brokerage || company || '',
      officeAddress: officeAddress || '',
      website: website || '',
      bio: bio || '',
      
      // Status
      status: 'pending',
      approved: false,
      isActive: false,
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await adminDb.collection('users').doc(userRecord.uid).set(userData)

    // Log activity
    await logActivity({
      type: 'user',
      action: 'created',
      userId: userRecord.uid,
      userName: name,
      userEmail: email,
      metadata: { professionalCode, role, licenseNumber },
    })

    // Generate password reset link for immediate setup
    const resetLink = await adminAuth.generatePasswordResetLink(email)

    // Send welcome email with credentials immediately
    try {
      await sendEmail({
        to: email,
        subject: `Welcome to Viventa - Your ${role === 'broker' ? 'Broker' : 'Agent'} Account`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0B2545 0%, #134074 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .credential-box { background: white; border-left: 4px solid #00A676; padding: 20px; margin: 20px 0; border-radius: 5px; }
              .credential-box strong { color: #0B2545; }
              .button { display: inline-block; background: linear-gradient(135deg, #00A676 0%, #00C896 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
              .badge { display: inline-block; background: #00A676; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to Viventa!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Your professional account has been created</p>
              </div>
              <div class="content">
                <p>Hi <strong>${name}</strong>,</p>
                
                <p>Your ${role === 'broker' ? 'Broker' : 'Agent'} account on Viventa has been created by our admin team. Complete your account setup to start using the platform.</p>
                
                <div class="credential-box">
                  <h3 style="margin-top: 0; color: #0B2545;">📋 Your Account Details</h3>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Professional Code:</strong> <span class="badge">${professionalCode}</span></p>
                  <p><strong>Role:</strong> ${role === 'broker' ? 'Broker' : 'Real Estate Agent'}</p>
                  ${licenseNumber ? `<p><strong>License:</strong> ${licenseNumber}</p>` : ''}
                </div>
                
                <h3 style="color: #0B2545;">🔐 Set Up Your Password</h3>
                <p>To complete your account setup, please create your password by clicking the button below:</p>
                
                <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Set Up My Password</a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 20px;">
                  <strong>Note:</strong> This link will expire in 1 hour. Your account is pending approval - you'll receive another email once approved.
                </p>
                
                <div class="footer">
                  <p><strong>Viventa RD</strong> - Your Real Estate Platform</p>
                  <p>Need help? Contact us at support@viventa.com</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      ok: true,
      success: true,
      uid: userRecord.uid,
      professionalCode,
      message: 'Professional account created successfully. Welcome email sent.',
    })
  } catch (error: any) {
    console.error('Error creating professional:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create professional' },
      { status: 500 }
    )
  }
}

// PATCH - Approve a professional and send credentials
export async function PATCH(request: NextRequest) {
  try {
    const { uid } = await request.json()

    if (!uid) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    // Get Admin SDK instances
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not initialized' },
        { status: 500 }
      )
    }

    // Get user data
    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()!

    // Update user status to approved
    await adminDb.collection('users').doc(uid).update({
      status: 'approved',
      approved: true,
      isActive: true,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // Generate password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(userData.email)

    // Send welcome email with credentials
    const emailSent = await sendEmail({
      to: userData.email,
      subject: `Welcome to Viventa - Your ${userData.role === 'broker' ? 'Broker' : 'Agent'} Account is Ready!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0B2545 0%, #134074 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credential-box { background: white; border-left: 4px solid #00A676; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .credential-box strong { color: #0B2545; }
            .button { display: inline-block; background: linear-gradient(135deg, #00A676 0%, #00C896 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            .badge { display: inline-block; background: #00A676; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Viventa!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your professional account has been approved</p>
            </div>
            <div class="content">
              <p>Hi <strong>${userData.name}</strong>,</p>
              
              <p>Congratulations! Your ${userData.role === 'broker' ? 'Broker' : 'Agent'} account on Viventa has been approved and is now active. You're ready to start using our professional platform.</p>
              
              <div class="credential-box">
                <h3 style="margin-top: 0; color: #0B2545;">📋 Your Account Details</h3>
                <p><strong>Email:</strong> ${userData.email}</p>
                <p><strong>Professional Code:</strong> <span class="badge">${userData.professionalCode}</span></p>
                <p><strong>Role:</strong> ${userData.role === 'broker' ? 'Broker' : 'Real Estate Agent'}</p>
                <p><strong>License:</strong> ${userData.licenseNumber}</p>
              </div>
              
              <h3 style="color: #0B2545;">🔐 Set Up Your Password</h3>
              <p>To complete your account setup, please create your password by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Set Up My Password</a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                <strong>Note:</strong> This link will expire in 1 hour for security reasons. If you need a new link, please contact support.
              </p>
              
              <h3 style="color: #0B2545; margin-top: 30px;">✨ What's Next?</h3>
              <ul>
                <li>Set up your password using the link above</li>
                <li>Log in to your ${userData.role === 'broker' ? 'broker' : 'agent'} dashboard at <a href="https://viventa.com.do/login">viventa.com.do/login</a></li>
                <li>${userData.role === 'broker' ? 'Manage your team and track performance' : 'Start managing your listings and leads'}</li>
                <li>Complete your profile with a photo and additional details</li>
              </ul>
              
              <p>If you have any questions or need assistance, our support team is here to help!</p>
              
              <p style="margin-top: 30px;">Welcome aboard! 🚀</p>
              
              <p style="margin-top: 20px;">
                Best regards,<br>
                <strong>The Viventa Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Viventa. All rights reserved.</p>
              <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    // Log activity
    await logActivity({
      type: 'user',
      action: 'approved',
      userId: uid,
      userName: userData.name,
      userEmail: userData.email,
      metadata: { emailSent, professionalCode: userData.professionalCode, role: userData.role },
    })

    return NextResponse.json({
      success: true,
      message: 'Professional approved and credentials sent',
      emailSent,
    })
  } catch (error: any) {
    console.error('Error approving professional:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve professional' },
      { status: 500 }
    )
  }
}
