/**
 * Firebase Storage service for file uploads
 */

import { storage } from './firebaseClient'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTaskSnapshot } from 'firebase/storage'

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
  const formData = new FormData()
  formData.append('folderPath', folderPath)
  files.forEach((file) => formData.append('files', file))

  files.forEach((_, index) => {
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

  files.forEach((_, index) => {
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
  const maxSize = 4 * 1024 * 1024 // 4MB (Next.js body limit constraint)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.'
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 4MB.'
    }
  }

  return { valid: true }
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
