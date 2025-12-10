'use client'

import { Badge } from '@/components/atomics/badge'
import { Button } from '@/components/atomics/button'
import { FileIcon } from '@/components/files/FileIcon'
import { FileUpload } from '@/components/files/FileUpload'
import { TaskAttachment } from '@/types'
import { format } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import { Download, Loader2, MessageSquare, Paperclip, Upload } from 'lucide-react'

interface FileTypeConfig {
  label: string
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
  badgeColor: string
  description: string
}

interface TaskFileSectionProps {
  type: 'context' | 'result' | 'feedback'
  attachments: TaskAttachment[]
  canUpload: boolean
  onFileDownload: (attachment: TaskAttachment) => void
  onFileDelete: (attachment: TaskAttachment) => void
  onFilesChange: (files: File[]) => void
  uploadedFiles: File[]
  onUpload?: () => void
  isSubmitting: boolean
  userRole: 'admin' | 'employee' | null
  taskStatus: string
}

const FILE_TYPE_CONFIGS: Record<string, FileTypeConfig> = {
  context: {
    label: 'Reference',
    icon: Paperclip,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    description: 'Admin-provided reference materials',
  },
  result: {
    label: 'Result',
    icon: Upload,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    description: 'Employee work deliverables',
  },
  feedback: {
    label: 'Feedback',
    icon: MessageSquare,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    description: 'Admin review and revision notes',
  },
}

export function TaskFileSection({
  type,
  attachments,
  canUpload,
  onFileDownload,
  onFileDelete,
  onFilesChange,
  uploadedFiles,
  onUpload,
  isSubmitting,
  userRole,
  taskStatus,
}: TaskFileSectionProps) {
  const config = FILE_TYPE_CONFIGS[type]
  const IconComponent = config.icon

  const canDeleteFile = (attachment: TaskAttachment) => {
    // Admin can delete their own files, but NOT on approved tasks
    if (userRole === 'admin' && attachment.uploadedByRole === 'admin' && taskStatus !== 'done') {
      return true
    }
    // Employee can delete result files only during work
    if (
      userRole === 'employee' &&
      attachment.uploadedByRole === 'employee' &&
      attachment.attachmentType === 'result' &&
      (taskStatus === 'in_progress' || taskStatus === 'revision' || taskStatus === 'rejected')
    ) {
      return true
    }
    // Admin can delete feedback files on rejected tasks
    if (
      userRole === 'admin' &&
      attachment.uploadedByRole === 'admin' &&
      attachment.attachmentType === 'feedback' &&
      (taskStatus === 'revision' || taskStatus === 'rejected')
    ) {
      return true
    }
    return false
  }

  return (
    <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
      <div className='flex items-center gap-2 mb-3'>
        <IconComponent className={`h-5 w-5 ${config.color}`} />
        <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
          {config.label} Files
        </h4>
        <Badge variant='secondary' className={`text-xs ${config.badgeColor}`}>
          {attachments.length}
        </Badge>
      </div>

      <p className='text-xs text-gray-600 dark:text-gray-400 mb-3'>{config.description}</p>

      {attachments.length === 0 ? (
        <div className='text-center py-6 text-gray-500 dark:text-gray-400'>
          <IconComponent className={`h-8 w-8 mx-auto mb-2 ${config.color} opacity-50`} />
          <p className='text-sm'>No {config.label.toLowerCase()} files yet</p>
          {type === 'result' && <p className='text-xs mt-1'>File upload is optional</p>}
        </div>
      ) : (
        <div className='space-y-2'>
          {attachments.map(att => (
            <div
              key={att.id}
              className='group flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow'
            >
              <div className='flex items-center gap-3 flex-grow min-w-0'>
                <FileIcon filename={att.fileName} className='h-6 w-6 flex-shrink-0' />
                <div className='flex-grow min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <p className='text-sm font-medium truncate'>{att.fileName}</p>
                    <Badge variant='outline' className={`text-xs ${config.badgeColor}`}>
                      {config.label}
                    </Badge>
                  </div>
                  <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                    <span>{(att.fileSize / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>{format(att.uploadedAt.toDate(), 'MMM dd, yyyy')}</span>
                    <span>•</span>
                    <span className='capitalize'>{att.uploadedByRole}</span>
                  </div>
                </div>
              </div>
              <div className='flex gap-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onFileDownload(att)}
                  className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  <Download className='h-4 w-4' />
                </Button>
                {canDeleteFile(att) && (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => onFileDelete(att)}
                    className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30'
                    disabled={isSubmitting}
                  >
                    {(() => {
                      const { Trash2 } = require('lucide-react')
                      return <Trash2 className='h-4 w-4' />
                    })()}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Integrated Upload Section */}
      {canUpload && (
        <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
          <div className='text-center'>
            <h5 className='text-xs font-medium text-gray-700 dark:text-gray-300 mb-3'>
              Upload {config.label} Files
            </h5>
            <FileUpload onFilesChange={onFilesChange} disabled={isSubmitting} />
            {/* Auto-upload for context files */}
            {type === 'context' && uploadedFiles.length > 0 && onUpload && (
              <Button onClick={onUpload} disabled={isSubmitting} className='mt-3 w-full' size='sm'>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className='mr-2 h-4 w-4' />
                    Upload Context Files
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
