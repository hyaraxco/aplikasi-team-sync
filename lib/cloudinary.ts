/**
 * Cloudinary configuration and utilities
 * Free alternative to Firebase Storage with better CORS support
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
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'team-sync-uploads',
}

/**
 * Determine resource type based on file MIME type
 */
const getResourceType = (mimeType: string): 'image' | 'video' | 'raw' => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'raw' // For documents, PDFs, etc.
}

/**
 * Network connectivity test before upload
 */
const testCloudinaryConnectivity = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing Cloudinary connectivity...')

    // Test basic connectivity with HEAD request
    const testUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`
    const response = await fetch(testUrl, {
      method: 'HEAD',
      mode: 'cors',
    })

    console.log('🌐 Connectivity test result:', response.status)
    return true
  } catch (error) {
    console.error('❌ Connectivity test failed:', error)
    return false
  }
}

/**
 * XMLHttpRequest fallback for fetch issues
 */
const uploadWithXHR = async (
  file: File,
  folder: string
): Promise<{
  url: string
  publicId: string
  secureUrl: string
  format: string
  bytes: number
}> => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Trying XMLHttpRequest fallback...')

    const xhr = new XMLHttpRequest()
    const formData = new FormData()

    formData.append('file', file)
    formData.append('upload_preset', cloudinaryConfig.uploadPreset)
    formData.append('folder', folder)

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`

    xhr.open('POST', uploadUrl, true)

    xhr.onload = () => {
      console.log('📡 XHR Response status:', xhr.status)

      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText)
          console.log('✅ XHR Upload success:', result)
          resolve({
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format,
            bytes: result.bytes,
          })
        } catch (parseError) {
          console.error('❌ XHR Parse error:', parseError)
          reject(new Error(`Failed to parse response: ${xhr.responseText}`))
        }
      } else {
        console.error('❌ XHR Upload error:', xhr.responseText)
        reject(new Error(`XHR Upload failed (${xhr.status}): ${xhr.responseText}`))
      }
    }

    xhr.onerror = () => {
      console.error('❌ XHR Network error')
      reject(new Error('XHR Network error - unable to connect to Cloudinary'))
    }

    xhr.ontimeout = () => {
      console.error('❌ XHR Timeout')
      reject(new Error('XHR Upload timeout'))
    }

    xhr.timeout = 30000 // 30 second timeout

    console.log('🚀 Starting XHR upload...')
    xhr.send(formData)
  })
}

/**
 * Simplified upload with comprehensive error handling and fallbacks
 */
export const uploadToCloudinarySimple = async (
  file: File,
  folder: string
): Promise<{
  url: string
  publicId: string
  secureUrl: string
  format: string
  bytes: number
}> => {
  try {
    // Validate configuration
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      throw new Error(
        'Cloudinary configuration is incomplete. Please check your environment variables.'
      )
    }

    console.log('🚀 Starting Cloudinary upload:', {
      fileName: file.name,
      fileSize: file.size,
      folder,
      preset: cloudinaryConfig.uploadPreset,
      cloudName: cloudinaryConfig.cloudName,
    })

    // Test connectivity first
    const isConnected = await testCloudinaryConnectivity()
    if (!isConnected) {
      console.warn('⚠️ Connectivity test failed, but proceeding with upload...')
    }

    // Use exact same approach as working browser test
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', cloudinaryConfig.uploadPreset)
    formData.append('folder', folder)

    // Use auto endpoint like working browser test
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`

    console.log('📡 Fetch URL:', uploadUrl)

    // Try fetch with minimal configuration
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
    })

    console.log('📡 Response status:', response.status)

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = `HTTP ${response.status} ${response.statusText}`
      }

      console.error('❌ Upload error:', errorText)
      throw new Error(`Upload failed (${response.status}): ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Upload success:', result)

    return {
      url: result.url,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      format: result.format,
      bytes: result.bytes,
    }
  } catch (error) {
    console.error('💥 Fetch upload failed:', error)

    // If fetch fails with "Failed to fetch", try XMLHttpRequest
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log('🔄 Fetch failed, trying XMLHttpRequest fallback...')
      try {
        return await uploadWithXHR(file, folder)
      } catch (xhrError) {
        console.error('💥 XHR fallback also failed:', xhrError)
        throw new Error(
          `Both fetch and XHR failed. Fetch: ${error.message}, XHR: ${xhrError instanceof Error ? xhrError.message : String(xhrError)}`
        )
      }
    }

    throw error
  }
}

/**
 * Original complex upload with fallback to simple version
 */
export const uploadToCloudinary = async (
  file: File,
  folder: string
): Promise<{
  url: string
  publicId: string
  secureUrl: string
  format: string
  bytes: number
}> => {
  try {
    // Try simple approach first (matches working browser test)
    return await uploadToCloudinarySimple(file, folder)
  } catch (simpleError) {
    console.warn(
      '⚠️ Simple upload failed, trying complex approach:',
      simpleError instanceof Error ? simpleError.message : String(simpleError)
    )

    // Fallback to complex approach
    return await uploadToCloudinaryComplex(file, folder)
  }
}

/**
 * Complex upload with resource type detection and headers
 */
const uploadToCloudinaryComplex = async (
  file: File,
  folder: string
): Promise<{
  url: string
  publicId: string
  secureUrl: string
  format: string
  bytes: number
}> => {
  try {
    // Validate configuration
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      throw new Error(
        'Cloudinary configuration is incomplete. Please check your environment variables.'
      )
    }

    // Determine resource type for proper endpoint
    const resourceType = getResourceType(file.type)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', cloudinaryConfig.uploadPreset)
    formData.append('folder', folder)

    // Add additional parameters for better organization
    formData.append('use_filename', 'true')
    formData.append('unique_filename', 'true')

    // Use proper resource type endpoint as per Cloudinary documentation
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`

    console.log('Uploading to Cloudinary:', {
      url: uploadUrl,
      folder,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // Add headers for better compatibility
      headers: {
        Accept: 'application/json',
      },
    })

    console.log('Cloudinary response status:', response.status)

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = `HTTP ${response.status} ${response.statusText}`
      }

      console.error('Cloudinary upload error:', errorText)

      // Check for specific error types based on Cloudinary documentation
      if (errorText.includes('Upload preset must be whitelisted for unsigned uploads')) {
        throw new Error(
          `Upload preset '${cloudinaryConfig.uploadPreset}' must be configured for unsigned uploads. Please go to Cloudinary Dashboard → Settings → Upload → Edit preset → Set Signing mode to 'Unsigned'`
        )
      } else if (
        errorText.includes('upload_preset') ||
        errorText.includes('Invalid upload preset')
      ) {
        throw new Error(
          `Upload preset '${cloudinaryConfig.uploadPreset}' not found or invalid. Please check your Cloudinary dashboard: Settings > Upload presets`
        )
      } else if (errorText.includes('Invalid cloud name')) {
        throw new Error(
          `Invalid cloud name '${cloudinaryConfig.cloudName}'. Please check your NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
        )
      } else if (errorText.includes('Unauthorized')) {
        throw new Error(`Unauthorized access. Please check your Cloudinary API credentials`)
      } else if (response.status === 0 || errorText.includes('Failed to fetch')) {
        throw new Error(
          `Network error: Unable to connect to Cloudinary. Please check your internet connection`
        )
      } else {
        throw new Error(`Cloudinary upload failed (${response.status}): ${errorText}`)
      }
    }

    const result = await response.json()
    console.log('Cloudinary upload success:', result)

    return {
      url: result.url,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      format: result.format,
      bytes: result.bytes,
    }
  } catch (error) {
    console.error('Upload to Cloudinary failed:', error)
    throw error
  }
}

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    })

    return response.ok
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    return false
  }
}

/**
 * Generate secure download URL with authentication
 */
export const generateSecureUrl = (
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

/**
 * Get file info from Cloudinary
 */
export const getCloudinaryFileInfo = async (publicId: string) => {
  try {
    const response = await fetch('/api/cloudinary/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get file info: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting Cloudinary file info:', error)
    return null
  }
}
