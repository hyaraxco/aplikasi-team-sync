import { v2 as cloudinary } from 'cloudinary'
import { NextRequest, NextResponse } from 'next/server'

// Configure Cloudinary
const cloudConfig = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}

// Log config status (without exposing secrets)
console.log('🔧 Cloudinary config status:', {
  cloud_name: cloudConfig.cloud_name ? '✓ Set' : '✗ Missing',
  api_key: cloudConfig.api_key ? '✓ Set' : '✗ Missing',
  api_secret: cloudConfig.api_secret ? '✓ Set' : '✗ Missing',
})

cloudinary.config(cloudConfig)

export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 })
    }

    // Check if configuration is complete
    if (!cloudConfig.cloud_name || !cloudConfig.api_key || !cloudConfig.api_secret) {
      console.error('🚨 Cloudinary configuration incomplete')
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details:
            'Cloudinary credentials not properly configured. Please check environment variables.',
        },
        { status: 503 }
      )
    }

    console.log('🗑️ Attempting to delete publicId:', publicId)

    // Clean the publicId - remove any extra spaces and normalize
    const cleanPublicId = publicId.trim().replace(/\s+/g, '_')
    console.log('🗑️ Cleaned publicId:', cleanPublicId)

    // Delete the file from Cloudinary
    // According to Cloudinary docs, we need to specify resource_type for non-image files
    // Since we're uploading with 'auto', we should also delete with resource_type 'raw' for documents
    const result = await cloudinary.uploader.destroy(cleanPublicId, {
      invalidate: true, // Invalidate CDN cache
      resource_type: 'raw', // For non-image files like documents
    })

    console.log('🗑️ Cloudinary delete result:', result)

    if (result.result === 'ok' || result.result === 'not found') {
      // 'not found' is also considered success (file already deleted)
      return NextResponse.json({ success: true, result })
    } else {
      // If first attempt fails, try with image resource type
      console.log('🗑️ First delete attempt failed, trying with image resource type')
      const imageResult = await cloudinary.uploader.destroy(cleanPublicId, {
        invalidate: true,
        resource_type: 'image',
      })

      if (imageResult.result === 'ok' || imageResult.result === 'not found') {
        return NextResponse.json({ success: true, result: imageResult })
      }

      console.error('🗑️ Delete failed with both resource types:', {
        rawResult: result,
        imageResult,
      })
      return NextResponse.json(
        { error: 'Failed to delete file', result, imageResult },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}
