// app/api/social/post/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: Request) {
  try {
    const { content, type, image } = await request.json()

    if (!content || !type) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    // TODO: Get user info from session
    const docRef = await addDoc(collection(db, 'social_posts'), {
      userId: 'temp-user-id', // TODO: Get from session
      userName: 'Usuario', // TODO: Get from session
      userAvatar: null,
      type,
      content,
      image: image || null,
      likes: 0,
      comments: 0,
      timestamp: serverTimestamp(),
    })

    return NextResponse.json({ ok: true, id: docRef.id })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ ok: false, error: 'Error al crear publicación' }, { status: 500 })
  }
}
