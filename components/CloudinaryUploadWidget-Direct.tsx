'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './atomics'
import { Upload, FileText, Image, Video, Loader2 } from 'lucide-react'
import { cloudinaryConfig } from '@/lib/cloudinary'

// Declare Cloudinary global type
declare global {
  interface Window {
    cloudinary: any
  }
}

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
 * Direct Cloudinary Upload Widget Implementation
 * Uses the official Cloudinary Upload Widget script directly
 * More reliable than next-cloudinary wrapper
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
  className = ''
}: CloudinaryUploadWidgetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const widgetRef = useRef<any>(null)

  // Load Cloudinary script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.cloudinary) {
      const script = document.createElement('script')
      script.src = 'https://upload-widget.cloudinary.com/global/all.js'
      script.async = true
      script.onload = () => {
        console.log('✅ Cloudinary script loaded successfully')
        setIsScriptLoaded(true)
      }
      script.onerror = () => {
        console.error('❌ Failed to load Cloudinary script')
        onUploadError?.('Failed to load upload widget. Please refresh the page.')
      }
      document.head.appendChild(script)
    } else if (window.cloudinary) {
      setIsScriptLoaded(true)
    }
  }, [onUploadError])

  // Initialize widget when script is loaded
  useEffect(() => {
    if (isScriptLoaded && window.cloudinary && !widgetRef.current) {
      try {
        console.log('🚀 Initializing Cloudinary Upload Widget...')
        
        widgetRef.current = window.cloudinary.createUploadWidget(
          {
            cloudName: cloudinaryConfig.cloudName,
            uploadPreset: cloudinaryConfig.uploadPreset,
            folder: folder,
            sources: ['local', 'url', 'camera'],
            multiple: false,
            maxFiles: 1,
            maxFileSize: maxFileSize,
            clientAllowedFormats: accept ? accept.split(',').map(f => f.trim().replace('.', '')) : undefined,
            cropping: false,
            showAdvancedOptions: false,
            showCompletedButton: true,
            showUploadMoreButton: false,
            styles: {
              palette: {
                window: '#ffffff',
                sourceBg: '#f4f4f5',
                windowBorder: '#90a4ae',
                tabIcon: '#0078ff',
                inactiveTabIcon: '#69717d',
                menuIcons: '#5a616a',
                link: '#0078ff',
                action: '#0078ff',
                inProgress: '#0078ff',
                complete: '#20b832',
                error: '#ea4335',
                textDark: '#000000',
                textLight: '#ffffff'
              }
            }
          },
          (error: any, result: any) => {
            if (error) {
              console.error('❌ Cloudinary Upload Error:', error)
              setIsLoading(false)
              onUploadError?.(error.message || 'Upload failed')
              return
            }

            if (result && result.event === 'success') {
              console.log('🎉 Cloudinary Upload Success:', result.info)
              setIsLoading(false)
              
              onUploadSuccess({
                url: result.info.url,
                publicId: result.info.public_id,
                secureUrl: result.info.secure_url,
                format: result.info.format,
                bytes: result.info.bytes
              })
            }

            if (result && result.event === 'queues-start') {
              setIsLoading(true)
            }

            if (result && result.event === 'queues-end') {
              setIsLoading(false)
            }
          }
        )
        
        console.log('✅ Cloudinary Upload Widget initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize Cloudinary widget:', error)
        onUploadError?.('Failed to initialize upload widget')
      }
    }
  }, [isScriptLoaded, folder, maxFileSize, accept, onUploadSuccess, onUploadError])

  const handleUpload = () => {
    if (!widgetRef.current) {
      console.error('❌ Cloudinary widget not initialized')
      onUploadError?.('Upload widget not ready. Please try again.')
      return
    }

    if (!isScriptLoaded) {
      console.error('❌ Cloudinary script not loaded')
      onUploadError?.('Upload widget still loading. Please wait a moment.')
      return
    }

    try {
      console.log('🚀 Opening Cloudinary Upload Widget...')
      widgetRef.current.open()
    } catch (error) {
      console.error('❌ Failed to open upload widget:', error)
      onUploadError?.('Failed to open upload widget')
    }
  }

  const getFileIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'image':
        return <Image className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <Button
      type="button"
      variant={buttonVariant}
      onClick={handleUpload}
      disabled={disabled || !isScriptLoaded || isLoading}
      className={`flex items-center gap-2 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Upload className="w-4 h-4" />
      )}
      {isLoading ? 'Uploading...' : !isScriptLoaded ? 'Loading...' : buttonText}
    </Button>
  )
}

/**
 * Specialized upload widgets for different file types
 */

export function ImageUploadWidget(props: Omit<CloudinaryUploadWidgetProps, 'accept'>) {
  return (
    <CloudinaryUploadWidget
      {...props}
      accept="image/*"
      buttonText={props.buttonText || 'Upload Image'}
    />
  )
}

export function VideoUploadWidget(props: Omit<CloudinaryUploadWidgetProps, 'accept'>) {
  return (
    <CloudinaryUploadWidget
      {...props}
      accept="video/*"
      buttonText={props.buttonText || 'Upload Video'}
      maxFileSize={52428800} // 50MB for videos
    />
  )
}

export function DocumentUploadWidget(props: Omit<CloudinaryUploadWidgetProps, 'accept'>) {
  return (
    <CloudinaryUploadWidget
      {...props}
      accept=".pdf,.doc,.docx,.txt,.rtf"
      buttonText={props.buttonText || 'Upload Document'}
    />
  )
}
