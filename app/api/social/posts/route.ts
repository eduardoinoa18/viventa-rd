// app/api/social/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'

function getCookie(req: NextRequest, name: string): string | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export async function GET(req: NextRequest) {
  try {
    const q = query(collection(db, 'social_posts'), orderBy('createdAt', 'desc'), limit(100))
    const snap = await getDocs(q)
    const posts = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ ok: true, posts })
  } catch (e) {
    console.error('social posts GET error', e)
    return NextResponse.json({ ok: true, posts: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = getCookie(req, 'viventa_role')
    const uid = getCookie(req, 'viventa_uid')
    const name = getCookie(req, 'viventa_name')

    if (!uid || !role) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }
    // Temporarily restrict publishing to master_admin only (public can still view; others can like/comment)
    if (role !== 'master_admin') {
      return NextResponse.json({ ok: false, error: 'Publishing is restricted' }, { status: 403 })
    }

    const { type, title, text, videoUrl, listingId, listingTitle } = await req.json()
    if (!type || !['video', 'listing', 'text'].includes(type)) {
      return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 })
    }

    const docRef = await addDoc(collection(db, 'social_posts'), {
      type,
      title: title || null,
      text: text || null,
      videoUrl: videoUrl || null,
      listingId: listingId || null,
      listingTitle: listingTitle || null,
      authorId: uid,
      authorName: name || 'Agente',
      authorRole: role,
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
    })

    // Gamification: content_shared
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/gamification/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, action: 'content_shared' })
      })
    } catch {}

    return NextResponse.json({ ok: true, id: docRef.id })
  } catch (e) {
    console.error('social posts POST error', e)
    return NextResponse.json({ ok: false, error: 'Failed to create post' }, { status: 500 })
  }
}
