/**
 * Firebase Storage service for file uploads
 */

import { storage } from './firebaseClient'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTaskSnapshot } from 'firebase/storage'

const MAX_LISTING_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024
const MAX_LISTING_SOURCE_SIZE_BYTES = 20 * 1024 * 1024

export interface UploadProgress {
  progress: number
  status: 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

/**
 * Upload a single image to Firebase Storage
 */
export async function uploadImage(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      'state_changed',
      (snapshot: any) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        if (onProgress) onProgress(progress)
      },
      (error: any) => {
        console.error('Upload error:', error)
        reject(error)
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        } catch (error) {
          reject(error)
        }
      }
    )
  })
}

/**
 * Upload a generic file (PDF/DOC/DOCX/images) to Firebase Storage
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      'state_changed',
      (snapshot: any) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        if (onProgress) onProgress(progress)
      },
      (error: any) => {
        console.error('Upload error:', error)
        reject(error)
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        } catch (error) {
          reject(error)
        }
      }
    )
  })
}

/**
 * Upload multiple images to Firebase Storage
 */
export async function uploadMultipleImages(
  files: File[],
  folderPath: string,
  onProgressUpdate?: (index: number, progress: number) => void
): Promise<string[]> {
  const optimizedFiles: File[] = []

  for (let index = 0; index < files.length; index++) {
    const optimized = await optimizeListingImage(files[index])
    if (optimized.size > MAX_LISTING_UPLOAD_SIZE_BYTES) {
      throw new Error(`Imagen ${index + 1}: no se pudo optimizar por debajo de 4MB. Prueba con una imagen de menor resolución.`)
    }
    optimizedFiles.push(optimized)
  }

  const formData = new FormData()
  formData.append('folderPath', folderPath)
  optimizedFiles.forEach((file) => formData.append('files', file))

  optimizedFiles.forEach((_, index) => {
    if (onProgressUpdate) onProgressUpdate(index, 10)
  })

  const response = await fetch('/api/uploads/listing-images', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload?.ok || !Array.isArray(payload?.urls)) {
    const errorMsg = payload?.error || `Error al subir imágenes (${response.status})`
    throw new Error(errorMsg)
  }

  optimizedFiles.forEach((_, index) => {
    if (onProgressUpdate) onProgressUpdate(index, 100)
  })

  return payload.urls as string[]
}

/**
 * Delete an image from Firebase Storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl)
    await deleteObject(imageRef)
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

/**
 * Delete multiple images from Firebase Storage
 */
export async function deleteMultipleImages(imageUrls: string[]): Promise<void> {
  const deletePromises = imageUrls.map(url => deleteImage(url))
  await Promise.allSettled(deletePromises)
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.'
    }
  }

  if (file.size > MAX_LISTING_SOURCE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File too large. Maximum source size is 20MB.'
    }
  }

  return { valid: true }
}

async function optimizeListingImage(file: File): Promise<File> {
  if (file.size <= MAX_LISTING_UPLOAD_SIZE_BYTES) {
    return file
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file
  }

  return compressImageToSize(file, MAX_LISTING_UPLOAD_SIZE_BYTES)
}

async function compressImageToSize(file: File, targetBytes: number): Promise<File> {
  const image = await loadImage(file)
  let quality = 0.86
  let scale = 1
  let bestBlob: Blob | null = null

  for (let attempt = 0; attempt < 9; attempt++) {
    const width = Math.max(320, Math.round(image.width * scale))
    const height = Math.max(320, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) break

    ctx.drawImage(image, 0, 0, width, height)
    const blob = await canvasToBlob(canvas, 'image/webp', quality)
    if (!blob) break

    bestBlob = !bestBlob || blob.size < bestBlob.size ? blob : bestBlob

    if (blob.size <= targetBytes) {
      return blobToFile(blob, file.name)
    }

    if (quality > 0.52) {
      quality -= 0.08
    } else {
      scale *= 0.82
    }
  }

  if (bestBlob) {
    return blobToFile(bestBlob, file.name)
  }

  return file
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo leer la imagen para optimizarla.'))
    }
    img.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality)
  })
}

function blobToFile(blob: Blob, originalName: string): File {
  const safeBase = originalName.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${safeBase}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}

/**
 * Validate generic file (pdf/doc/docx/images)
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Sube PDF, DOC, DOCX o imágenes (JPG/PNG/WebP).'
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Archivo muy grande. Tamaño máximo 10MB.'
    }
  }

  return { valid: true }
}

/**
 * Validate multiple image files
 */
export function validateImageFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (files.length === 0) {
    return { valid: false, errors: ['Please select at least one image'] }
  }

  if (files.length > 10) {
    return { valid: false, errors: ['Maximum 10 images allowed'] }
  }

  files.forEach((file, index) => {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      errors.push(`Image ${index + 1}: ${validation.error}`)
    }
  })

  return { valid: errors.length === 0, errors }
}

/**
 * Generate a unique folder path for property images
 */
export function generatePropertyImagePath(userId: string, propertyId?: string): string {
  // Use a path that matches storage.rules permissions
  const id = propertyId || `temp_${Date.now()}`
  return `listing_images/${userId}/${id}`
}

/**
 * Generate a path for application uploads
 */
export function generateApplicationFilePath(type: 'agent' | 'broker' | 'developer', originalName: string) {
  const timestamp = Date.now()
  const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_')
  return `applications/${type}/${timestamp}_${safeName}`
}
