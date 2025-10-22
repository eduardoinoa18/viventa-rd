/**
 * Firebase Storage service for file uploads
 */

import { storage } from './firebaseClient'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'

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
 * Upload multiple images to Firebase Storage
 */
export async function uploadMultipleImages(
  files: File[],
  folderPath: string,
  onProgressUpdate?: (index: number, progress: number) => void
): Promise<string[]> {
  const uploadPromises = files.map((file, index) => {
    const timestamp = Date.now()
    const fileName = `${timestamp}_${index}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const path = `${folderPath}/${fileName}`
    
    return uploadImage(file, path, (progress) => {
      if (onProgressUpdate) onProgressUpdate(index, progress)
    })
  })

  return Promise.all(uploadPromises)
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
  const maxSize = 5 * 1024 * 1024 // 5MB
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
      error: 'File too large. Maximum size is 5MB.'
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
  const id = propertyId || `temp_${Date.now()}`
  return `properties/${userId}/${id}`
}
