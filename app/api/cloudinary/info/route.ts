import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 })
    }

    // Get file info from Cloudinary
    const result = await cloudinary.api.resource(publicId)

    return NextResponse.json({
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      createdAt: result.created_at,
      url: result.url,
      secureUrl: result.secure_url,
    })
  } catch (error) {
    console.error('Cloudinary info error:', error)
    return NextResponse.json(
      { error: 'Failed to get file info' },
      { status: 500 }
    )
  }
}
