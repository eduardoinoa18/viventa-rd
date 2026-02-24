import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getStorage } from 'firebase-admin/storage'
import { getServerSession } from '@/lib/auth/session'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

// Configure body parser to accept larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_FILES = 10

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

export async function POST(req: NextRequest) {
  try {
    getAdminDb()

    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Sesión inválida o expirada' }, { status: 401 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ ok: false, error: 'No se recibieron archivos' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ ok: false, error: `Máximo ${MAX_FILES} imágenes por carga` }, { status: 400 })
    }

    const bucketName = getBucketName()
    if (!bucketName) {
      return NextResponse.json({ ok: false, error: 'Storage no configurado en el servidor' }, { status: 500 })
    }

    const bucket = getStorage().bucket(bucketName)
    const uploadedUrls: string[] = []

    for (let index = 0; index < files.length; index++) {
      const file = files[index]

      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json({ ok: false, error: `Tipo de archivo no permitido: ${file.type}` }, { status: 400 })
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ ok: false, error: `Archivo demasiado grande: ${file.name}` }, { status: 400 })
      }

      const bytes = Buffer.from(await file.arrayBuffer())
      const safeName = sanitizeFileName(file.name || `image_${index}.jpg`)
      const objectPath = `listing_images/${session.uid}/temp_${Date.now()}_${index}_${safeName}`
      const token = randomUUID()

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

      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`
      uploadedUrls.push(downloadUrl)
    }

    return NextResponse.json({ ok: true, urls: uploadedUrls })
  } catch (error: any) {
    console.error('[UPLOAD] listing-images failed:', error?.message || error)
    return NextResponse.json({ ok: false, error: 'No se pudieron subir las imágenes' }, { status: 500 })
  }
}
