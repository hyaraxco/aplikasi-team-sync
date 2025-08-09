/**
 * Official Cloudinary Next.js SDK Implementation
 * Following Cloudinary's official documentation and best practices
 * https://cloudinary.com/documentation/upload_assets_in_nextjs_tutorial
 */

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
  uploadPreset: string
}

export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
}

/**
 * Cloudinary upload result interface matching official SDK
 */
export interface CloudinaryUploadResult {
  public_id: string
  version: number
  signature: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  tags: string[]
  bytes: number
  type: string
  etag: string
  placeholder: boolean
  url: string
  secure_url: string
  folder: string
  original_filename: string
  api_key: string
}

/**
 * Official Cloudinary upload following documentation best practices
 * https://cloudinary.com/documentation/upload_images#uploading_with_a_direct_call_to_the_rest_api
 */
export const uploadToCloudinary = (
  file: File,
  folder: string,
  onProgress?: (progress: number) => void
): Promise<{
  url: string
  publicId: string
  secureUrl: string
  format: string
  bytes: number
}> => {
  return new Promise((resolve, reject) => {
    // Validate configuration
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      return reject(
        new Error(
          'Cloudinary configuration is incomplete. Please check your environment variables.'
        )
      )
    }

    console.log('🚀 XHR Cloudinary upload:', {
      fileName: file.name,
      fileSize: file.size,
      folder,
      preset: cloudinaryConfig.uploadPreset,
      cloudName: cloudinaryConfig.cloudName,
    })

    // Create FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', cloudinaryConfig.uploadPreset)
    formData.append('folder', folder)

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`
    console.log('📡 Upload URL:', uploadUrl)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', uploadUrl, true)

    // Progress event listener
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        if (onProgress) {
          onProgress(progress)
        }
      }
    }

    // Handle completion
    xhr.onload = () => {
      console.log('📡 Response status:', xhr.status)

      if (xhr.status >= 200 && xhr.status < 300) {
        const result: CloudinaryUploadResult = JSON.parse(xhr.responseText)
        console.log('✅ Upload success:', result)
        resolve({
          url: result.url,
          publicId: result.public_id,
          secureUrl: result.secure_url,
          format: result.format,
          bytes: result.bytes,
        })
      } else {
        const errorText = xhr.responseText
        console.error('❌ Upload error:', errorText)
        if (errorText.includes('Upload preset must be whitelisted for unsigned uploads')) {
          reject(
            new Error(
              `Upload preset '${cloudinaryConfig.uploadPreset}' must be configured for unsigned uploads. Please go to Cloudinary Dashboard → Settings → Upload → Edit preset → Set Signing mode to 'Unsigned'`
            )
          )
        } else if (errorText.includes('upload_preset')) {
          reject(
            new Error(
              `Upload preset '${cloudinaryConfig.uploadPreset}' not found. Please check your Cloudinary dashboard: Settings > Upload presets`
            )
          )
        } else if (errorText.includes('Invalid cloud name')) {
          reject(
            new Error(
              `Invalid cloud name '${cloudinaryConfig.cloudName}'. Please check your NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
            )
          )
        } else {
          reject(new Error(`Upload failed (${xhr.status}): ${errorText}`))
        }
      }
    }

    // Handle errors
    xhr.onerror = () => {
      console.error('💥 Cloudinary upload failed:', xhr.statusText)
      reject(new Error(`Network error during upload: ${xhr.statusText}`))
    }

    xhr.send(formData)
  })
}

/**
 * Delete file from Cloudinary (requires server-side implementation)
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting from Cloudinary:', publicId)

    // Note: Deletion requires server-side implementation with API secret
    // This would need to be implemented as an API route
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    })

    return response.ok
  } catch (error) {
    console.error('❌ Delete failed:', error)
    return false
  }
}

/**
 * Generate Cloudinary URL for file access
 */
export const generateCloudinaryUrl = (
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: string
    format?: string
  } = {}
): string => {
  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}`

  let transformations = []

  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  if (options.quality) transformations.push(`q_${options.quality}`)
  if (options.format) transformations.push(`f_${options.format}`)

  const transformString = transformations.length > 0 ? `/${transformations.join(',')}` : ''

  return `${baseUrl}/image/upload${transformString}/${publicId}`
}
