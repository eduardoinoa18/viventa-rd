// app/api/notify/social/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const emailLower = String(email || '').trim().toLowerCase()

    if (!validateEmail(emailLower)) {
      return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 })
    }

    const headers = req.headers
    const ip = headers.get('x-forwarded-for') || headers.get('cf-connecting-ip') || ''
    const userAgent = headers.get('user-agent') || ''
    const referer = headers.get('referer') || ''

    // Use email as document id to dedupe
    const ref = doc(collection(db, 'waitlist_social'), emailLower)

    await setDoc(ref, {
      email: emailLower,
      ip,
      userAgent,
      referer,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      source: 'social_coming_soon'
    }, { merge: true })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('notify/social POST error', e)
    return NextResponse.json({ ok: false, error: 'No se pudo registrar tu interés' }, { status: 500 })
  }
}
