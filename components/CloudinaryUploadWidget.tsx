'use client'

import { uploadToCloudinary } from '@/lib/cloudinary'
import { Loader2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from './atomics/button'

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (result: {
    url: string
    publicId: string
    secureUrl: string
    format: string
    bytes: number
  }) => void
  onUploadError?: (error: string) => void
  folder: string
  buttonText?: string
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost'
  disabled?: boolean
  accept?: string
  maxFileSize?: number
  className?: string
}

/**
 * Cloudinary Upload Widget Component
 * Uses direct API upload for reliability
 */
export default function CloudinaryUploadWidget({
  onUploadSuccess,
  onUploadError,
  folder,
  buttonText = 'Upload File',
  buttonVariant = 'outline',
  disabled = false,
  accept,
  maxFileSize = 10485760, // 10MB default
  className = '',
}: CloudinaryUploadWidgetProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file size
    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / 1024 / 1024)
      onUploadError?.(`File size exceeds ${maxSizeMB}MB limit`)
      return
    }

    setIsUploading(true)

    try {
      console.log('🚀 Starting Cloudinary upload:', {
        fileName: file.name,
        fileSize: file.size,
        folder,
      })

      const result = await uploadToCloudinary(file, folder)

      console.log('✅ Upload successful:', result)

      onUploadSuccess({
        url: result.url,
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        format: result.format,
        bytes: result.bytes,
      })
    } catch (error) {
      console.error('❌ Upload failed:', error)
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset input value to allow same file upload again
    event.target.value = ''
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className='hidden'
      />

      {/* Upload button */}
      <Button
        type='button'
        variant={buttonVariant}
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        className='flex items-center gap-2 w-full'
      >
        {isUploading ? (
          <Loader2 className='w-4 h-4 animate-spin' />
        ) : (
          <Upload className='w-4 h-4' />
        )}
        {isUploading ? 'Uploading...' : buttonText}
      </Button>
    </div>
  )
}

/**
 * Specialized upload widgets for different file types
 */

export function ImageUploadWidget(props: Omit<CloudinaryUploadWidgetProps, 'accept'>) {
  return (
    <CloudinaryUploadWidget
      {...props}
      accept='image/*'
      buttonText={props.buttonText || 'Upload Image'}
    />
  )
}

export function VideoUploadWidget(props: Omit<CloudinaryUploadWidgetProps, 'accept'>) {
  return (
    <CloudinaryUploadWidget
      {...props}
      accept='video/*'
      buttonText={props.buttonText || 'Upload Video'}
      maxFileSize={52428800} // 50MB for videos
    />
  )
}

export function DocumentUploadWidget(props: Omit<CloudinaryUploadWidgetProps, 'accept'>) {
  return (
    <CloudinaryUploadWidget
      {...props}
      accept='.pdf,.doc,.docx,.txt,.rtf'
      buttonText={props.buttonText || 'Upload Document'}
    />
  )
}
