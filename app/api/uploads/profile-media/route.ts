import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getStorage } from 'firebase-admin/storage'
import { getServerSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'
export const maxDuration = 60

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024

function getBucketName(): string {
  const raw =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`

  return raw.replace(/^gs:\/\//, '').trim()
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function safeFolder(name: string): string {
  return name === 'agent' || name === 'broker' ? name : 'profile'
}

export async function POST(req: NextRequest) {
  try {
    getAdminDb()

    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ ok: false, error: 'Sesion invalida o expirada' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const folder = safeFolder(String(formData.get('folder') || 'profile'))

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Debes subir un archivo' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: 'Formato no permitido. Usa JPG, PNG o WEBP.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ ok: false, error: 'La imagen excede el maximo de 3MB' }, { status: 400 })
    }

    const bucketName = getBucketName()
    if (!bucketName) {
      return NextResponse.json({ ok: false, error: 'Storage no configurado' }, { status: 500 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const safeName = sanitizeFileName(file.name || 'profile_image.jpg')
    const objectPath = `profile_media/${folder}/${session.uid}/${Date.now()}_${safeName}`
    const token = randomUUID()

    const bucket = getStorage().bucket(bucketName)
    await bucket.file(objectPath).save(bytes, {
      resumable: false,
      metadata: {
        contentType: file.type,
        cacheControl: 'public,max-age=31536000',
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    })

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`

    return NextResponse.json({ ok: true, url })
  } catch (error) {
    console.error('[UPLOAD] profile-media failed:', error)
    return NextResponse.json({ ok: false, error: 'No se pudo subir la imagen' }, { status: 500 })
  }
}
