'use client'

import { Button } from '@/components/atomics/button'
import { useToast } from '@/hooks'
import { cn } from '@/lib/ui'
import { CheckCircle, Trash2, UploadCloud, XCircle } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { FileIcon } from './FileIcon'

export interface UploadedFilePreview {
  id: string
  file: File
  error?: 'size-limit' | 'type-error'
}

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  acceptedFileTypes?: string[]
  maxFileSize?: number // in bytes
  maxFiles?: number
  className?: string
  disabled?: boolean
}

export function FileUpload({
  onFilesChange,
  acceptedFileTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint
    'application/vnd.ms-powerpoint',
    'text/plain', // TXT
    'text/csv',
    // Images
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // Other
    'application/json',
    'text/xml',
    'application/xml',
  ],
  maxFileSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 5,
  className,
  disabled = false,
}: FileUploadProps) {
  const [filePreviews, setFilePreviews] = useState<UploadedFilePreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled) return
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIncomingFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFiles(e.target.files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleIncomingFiles = (incomingFiles: FileList) => {
    const newPreviews = [...filePreviews]

    for (const file of Array.from(incomingFiles)) {
      if (newPreviews.length >= maxFiles) {
        toast({
          title: 'File limit reached',
          description: `You can only upload a maximum of ${maxFiles} files.`,
          variant: 'destructive',
        })
        break
      }

      // Generate a unique ID using timestamp and random number to avoid duplicates
      const preview: UploadedFilePreview = {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
      }

      if (file.size > maxFileSize) {
        preview.error = 'size-limit'
      } else if (!acceptedFileTypes.includes(file.type)) {
        preview.error = 'type-error'
      }

      newPreviews.push(preview)
    }

    setFilePreviews(newPreviews)
    onFilesChange(newPreviews.filter(p => !p.error).map(p => p.file))
  }

  const removeFile = (id: string) => {
    const updatedPreviews = filePreviews.filter(p => p.id !== id)
    setFilePreviews(updatedPreviews)
    onFilesChange(updatedPreviews.filter(p => !p.error).map(p => p.file))
  }

  const onButtonClick = () => {
    if (!disabled) fileInputRef.current?.click()
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg transition-colors duration-200',
          {
            'border-primary bg-primary/10': dragActive && !disabled,
            'border-gray-300 dark:border-gray-600': !dragActive && !disabled,
            'cursor-not-allowed bg-gray-50 dark:bg-gray-800': disabled,
          }
        )}
      >
        <div className='absolute text-center p-4'>
          <UploadCloud
            className={cn('mx-auto h-12 w-12', disabled ? 'text-gray-400' : 'text-gray-500')}
          />
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-300'>
            Drag & Drop or{' '}
            <Button
              variant='link'
              type='button'
              onClick={onButtonClick}
              disabled={disabled}
              className='p-0 h-auto'
            >
              Choose file
            </Button>{' '}
            to upload
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            PDF, DOCX, Excel, PowerPoint, Images, ZIP, RAR, TXT up to 5MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type='file'
          multiple
          onChange={handleChange}
          accept={acceptedFileTypes.join(',')}
          className='hidden'
          disabled={disabled}
        />
      </div>

      {filePreviews.length > 0 && (
        <div className='space-y-2'>
          <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>Attachments</h4>
          {filePreviews.map(preview => (
            <div
              key={preview.id}
              className='flex items-center justify-between p-2 border rounded-lg bg-gray-50 dark:bg-gray-800'
            >
              <div className='flex items-center gap-3 flex-grow min-w-0'>
                <FileIcon filename={preview.file.name} className='h-8 w-8 flex-shrink-0' />
                <div className='flex-grow min-w-0'>
                  <p className='text-sm font-medium truncate'>{preview.file.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {(preview.file.size / 1024).toFixed(1)} KB
                  </p>
                  {preview.error === 'size-limit' && (
                    <p className='text-xs text-red-500 mt-1'>File exceeds size limit</p>
                  )}
                  {preview.error === 'type-error' && (
                    <p className='text-xs text-red-500 mt-1'>Invalid file type</p>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-2 ml-2 flex-shrink-0'>
                {preview.error ? (
                  <XCircle className='h-5 w-5 text-red-500' />
                ) : (
                  <CheckCircle className='h-5 w-5 text-green-500' />
                )}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => removeFile(preview.id)}
                  className='h-8 w-8'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
