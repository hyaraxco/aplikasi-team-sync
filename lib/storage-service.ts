import { TaskAttachment } from '@/types'
import { deleteFromCloudinary, uploadToCloudinary } from './cloudinary'

export interface UploadResult {
  url: string
  secureUrl: string
  publicId: string
  fileSize: number
  storageProvider: 'cloudinary'
}

export interface StorageService {
  upload(file: File, path: string, attachmentType: string): Promise<UploadResult>
  delete(attachment: TaskAttachment): Promise<boolean>
  getDownloadUrl(attachment: TaskAttachment): string
}

/**
 * Cloudinary Storage Service
 */
class CloudinaryStorageService implements StorageService {
  async upload(file: File, path: string, attachmentType: string): Promise<UploadResult> {
    try {
      // Create folder structure: tasks/taskId/attachmentType
      const folder = `team-sync/${path}/${attachmentType}`

      // Upload to Cloudinary using simplified function (same as working browser test)
      const result = await uploadToCloudinary(file, folder)

      return {
        url: result.url,
        secureUrl: result.secureUrl,
        publicId: result.publicId,
        fileSize: result.bytes,
        storageProvider: 'cloudinary',
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async delete(attachment: TaskAttachment): Promise<boolean> {
    if (!attachment.publicId) {
      console.warn('No publicId found for attachment, cannot delete from Cloudinary')
      return false
    }

    return await deleteFromCloudinary(attachment.publicId)
  }

  getDownloadUrl(attachment: TaskAttachment): string {
    // Cloudinary URLs are already public and CORS-enabled
    return attachment.secureUrl || attachment.fileUrl
  }
}

/**
 * Cloudinary Storage Service - Primary and only storage provider
 */

/**
 * Storage service factory - Cloudinary only
 */
export class StorageServiceFactory {
  private static cloudinaryService = new CloudinaryStorageService()

  static getService(): StorageService {
    return this.cloudinaryService
  }

  static getPreferredService(): StorageService {
    // Always use Cloudinary as the primary and only storage provider
    console.log('Using Cloudinary storage service')
    return this.cloudinaryService
  }
}

/**
 * Cloudinary download function - CORS-free downloads
 */
export const downloadFile = async (attachment: TaskAttachment): Promise<boolean> => {
  try {
    const service = StorageServiceFactory.getService()
    const downloadUrl = service.getDownloadUrl(attachment)

    // Create download link - Cloudinary URLs are CORS-free
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = attachment.fileName
    link.target = '_blank'

    // Cloudinary supports direct downloads without CORS issues
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    return true
  } catch (error) {
    console.error('Download error:', error)

    // Fallback: open in new tab
    try {
      const service = StorageServiceFactory.getService()
      const downloadUrl = service.getDownloadUrl(attachment)
      window.open(downloadUrl, '_blank')
      return true
    } catch (fallbackError) {
      console.error('Fallback download failed:', fallbackError)
      return false
    }
  }
}
