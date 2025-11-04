import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export async function GET() {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'admin'))
    if (docSnap.exists()) {
      return NextResponse.json({ ok: true, data: docSnap.data() })
    }
    // Return default settings
    const defaults = {
      siteName: 'VIVENTA',
      supportEmail: 'support@viventa.com',
      maintenanceMode: false,
      allowRegistration: true,
      allowAgentApplications: true,
      allowBrokerApplications: true,
      maxPropertiesPerAgent: 100,
      featuredPropertiesLimit: 10,
    }
    return NextResponse.json({ ok: true, data: defaults })
  } catch (e: any) {
    console.error('Error fetching admin settings:', e)
    // Return defaults on error
    const defaults = {
      siteName: 'VIVENTA',
      supportEmail: 'support@viventa.com',
      maintenanceMode: false,
      allowRegistration: true,
      allowAgentApplications: true,
      allowBrokerApplications: true,
      maxPropertiesPerAgent: 100,
      featuredPropertiesLimit: 10,
    }
    return NextResponse.json({ ok: true, data: defaults })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await setDoc(doc(db, 'settings', 'admin'), body, { merge: true })
    return NextResponse.json({ ok: true, data: body })
  } catch (e: any) {
    console.error('Error updating admin settings:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to update settings' }, { status: 500 })
  }
}
