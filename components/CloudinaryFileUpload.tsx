'use client'

import { uploadToCloudinary } from '@/lib/cloudinary'
import { FileText, Image, Loader2, Upload, Video } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from './atomics/button'

interface CloudinaryFileUploadProps {
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
 * Simple File Upload Component using Direct Cloudinary API
 * More reliable than widget-based approaches
 */
export default function CloudinaryFileUpload({
  onUploadSuccess,
  onUploadError,
  folder,
  buttonText = 'Upload File',
  buttonVariant = 'outline',
  disabled = false,
  accept,
  maxFileSize = 10485760, // 10MB default
  className = '',
}: CloudinaryFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
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
      console.log('🚀 Starting direct Cloudinary upload:', {
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
    console.log('Upload button clicked')
    console.log('File input ref:', fileInputRef.current)
    fileInputRef.current?.click()
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const getFileIcon = () => {
    if (accept?.includes('image')) return <Image className='w-4 h-4' />
    if (accept?.includes('video')) return <Video className='w-4 h-4' />
    return <FileText className='w-4 h-4' />
  }

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
        className='flex items-center gap-2 w-full relative z-10'
      >
        {isUploading ? (
          <Loader2 className='w-4 h-4 animate-spin' />
        ) : (
          <Upload className='w-4 h-4' />
        )}
        {isUploading ? 'Uploading...' : buttonText}
      </Button>

      {/* Drag and drop overlay */}
      {dragActive && (
        <div className='absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-20 pointer-events-none'>
          <div className='text-center'>
            <Upload className='w-8 h-8 mx-auto mb-2 text-blue-500' />
            <p className='text-sm font-medium text-blue-700'>Drop file here</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Specialized upload components for different file types
 */

export function ImageFileUpload(props: Omit<CloudinaryFileUploadProps, 'accept'>) {
  return (
    <CloudinaryFileUpload
      {...props}
      accept='image/*'
      buttonText={props.buttonText || 'Upload Image'}
    />
  )
}

export function VideoFileUpload(props: Omit<CloudinaryFileUploadProps, 'accept'>) {
  return (
    <CloudinaryFileUpload
      {...props}
      accept='video/*'
      buttonText={props.buttonText || 'Upload Video'}
      maxFileSize={52428800} // 50MB for videos
    />
  )
}

export function DocumentFileUpload(props: Omit<CloudinaryFileUploadProps, 'accept'>) {
  return (
    <CloudinaryFileUpload
      {...props}
      accept='.pdf,.doc,.docx,.txt,.rtf'
      buttonText={props.buttonText || 'Upload Document'}
    />
  )
}
