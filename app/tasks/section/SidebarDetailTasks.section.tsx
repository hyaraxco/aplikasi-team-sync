'use client'

import { Badge } from '@/components/atomics/badge'
import { Button } from '@/components/atomics/button'
import { Textarea } from '@/components/atomics/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/molecules/avatar'
import { Separator } from '@/components/molecules/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/molecules/sheet'

import { useToast } from '@/hooks'
import { db } from '@/lib/firebase'
import { StorageServiceFactory, downloadFile } from '@/lib/storage-service'
import { getTaskPriorityBadgeConfig } from '@/lib/ui'
import { TaskPriority } from '@/types'
import { format } from 'date-fns'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { Calendar, CheckCircle, Download, FileText, Paperclip, Upload, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { TaskCardProps } from './TaskCard.section'

interface SidebarDetailTasksProps {
  task: TaskCardProps | null
  isOpen: boolean
  userRole: 'admin' | 'employee' | null
  onOpenChange: (isOpen: boolean) => void
  onUpdateTask: (status: 'done' | 'revision', comment?: string) => Promise<void>
  onDataRefresh?: () => Promise<void>
}

export function SidebarDetailTasks({
  task,
  isOpen,
  userRole,
  onOpenChange,
  onUpdateTask,
  onDataRefresh,
}: SidebarDetailTasksProps) {
  const [revisionComment, setRevisionComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadType, setUploadType] = useState<'context' | 'result' | 'feedback' | null>(null)
  const { toast } = useToast()

  if (!task) return null

  // Admin cannot view tasks that are in progress (being worked on by employee)
  if (userRole === 'admin' && task.status === 'in_progress') {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className='w-[400px] sm:w-[540px]'>
          <SheetHeader>
            <SheetTitle>Task In Progress</SheetTitle>
            <SheetDescription>
              This task is currently being worked on by an employee. Please wait until it's
              completed for review.
            </SheetDescription>
          </SheetHeader>
          <div className='flex items-center justify-center h-[200px]'>
            <div className='text-center space-y-2'>
              <div className='text-4xl'>⏳</div>
              <p className='text-sm text-muted-foreground'>Task is being worked on...</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onUpdateTask('done')
      // Refresh data to ensure UI reflects the latest state
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } finally {
      setIsSubmitting(false)
      onOpenChange(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!revisionComment.trim()) {
      toast({
        title: 'Revision comment required',
        description: 'Please add a comment explaining what needs to be revised.',
        variant: 'destructive',
      })
      return
    }
    setIsSubmitting(true)
    try {
      await onUpdateTask('revision', revisionComment)
      // Refresh data to ensure UI reflects the latest state
      if (onDataRefresh) {
        await onDataRefresh()
      }
      setRevisionComment('') // Clear the comment after successful submission
    } finally {
      setIsSubmitting(false)
      onOpenChange(false)
    }
  }

  const uploadFile = async (file: File, attachmentType: 'context' | 'result' | 'feedback') => {
    if (!task) return

    setIsUploading(true)
    try {
      // Get Cloudinary storage service
      const storageService = StorageServiceFactory.getPreferredService()

      // Upload file using storage service
      const uploadResult = await storageService.upload(file, `tasks/${task.id}`, attachmentType)

      // Import arrayUnion for Firestore update
      const { arrayUnion } = await import('firebase/firestore')

      // Create attachment object
      const attachment = {
        id: Date.now().toString(),
        fileName: file.name,
        fileUrl: uploadResult.url,
        secureUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        fileSize: uploadResult.fileSize,
        fileType: file.type,
        uploadedBy: 'current-user', // You can get this from auth context
        uploadedByRole: userRole || 'employee',
        uploadedAt: new Date(),
        attachmentType: attachmentType,
        storageProvider: uploadResult.storageProvider,
      }

      // Update task with new attachment
      await updateDoc(doc(db, 'tasks', task.id), {
        attachments: arrayUnion(attachment),
        updatedAt: serverTimestamp(),
      })

      const typeLabels = {
        context: 'Context file',
        result: 'Result file',
        feedback: 'Feedback file',
      }

      toast({
        title: 'File Uploaded',
        description: `${typeLabels[attachmentType]} "${file.name}" has been uploaded successfully to Cloudinary.`,
      })

      // Refresh data to show new attachment
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: 'Upload Failed',
        description: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleContextFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadFile(file, 'context')
    event.target.value = ''
  }

  const handleResultFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadFile(file, 'result')
    event.target.value = ''
  }

  const handleFeedbackFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadFile(file, 'feedback')
    event.target.value = ''
  }

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent, type: 'context' | 'result' | 'feedback') => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
    setUploadType(type)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setUploadType(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0 && uploadType) {
      await uploadFile(files[0], uploadType)
    }
    setUploadType(null)
  }

  const handleFileDownload = async (attachment: any) => {
    try {
      const success = await downloadFile(attachment)
      if (!success) {
        toast({
          title: 'Download Failed',
          description: 'Unable to download file. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download Error',
        description: 'An error occurred while downloading the file.',
        variant: 'destructive',
      })
    }
  }

  const getPriorityBadgeConfig = (priority: string | undefined) => {
    return getTaskPriorityBadgeConfig(priority as TaskPriority)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-lg overflow-y-auto'>
        <SheetHeader className='space-y-1 pb-4'>
          <div className='flex justify-between items-start gap-2'>
            <SheetTitle className='text-lg flex-1'>{task.name}</SheetTitle>
            <div className='flex gap-2'>
              {(() => {
                const priorityBadge = getPriorityBadgeConfig(task.priority)
                return <span className={priorityBadge.className}>{priorityBadge.text}</span>
              })()}
              {(() => {
                // Import the utility function inline
                const { getTaskStatusBadgeConfig } = require('@/lib/ui')
                const badgeConfig = getTaskStatusBadgeConfig(
                  task.status as any,
                  userRole || 'employee'
                )
                return (
                  <Badge
                    className={badgeConfig.className.replace(
                      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                      ''
                    )}
                  >
                    {badgeConfig.text}
                  </Badge>
                )
              })()}
            </div>
          </div>
          <SheetDescription className='flex items-center gap-2 text-xs'>
            <Calendar className='h-3.5 w-3.5' />
            Due {format(task.dueDate, 'PPP')}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className='mt-6 space-y-6'>
          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-muted-foreground'>Assigned To</h3>
            <div className='flex items-center gap-2'>
              <Avatar className='h-8 w-8'>
                <AvatarImage src={task.assignee?.avatar} />
                <AvatarFallback>{task.assignee?.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium text-sm'>{task.assignee?.name}</p>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-muted-foreground'>Description</h3>
            <p className='text-sm text-muted-foreground'>{task.description}</p>
          </div>

          {/* File Attachments Section */}
          <div className='space-y-6'>
            <h3 className='text-lg font-semibold text-gray-900'>Files & Attachments</h3>

            {/* Context Files (Admin uploads for employee reference) */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                <h4 className='text-sm font-medium text-gray-700'>Reference Materials</h4>
                <span className='text-xs text-gray-500'>• Context files from admin</span>
              </div>

              {userRole === 'admin' ? (
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                    dragActive && uploadType === 'context'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={e => handleDragEnter(e, 'context')}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type='file'
                    id='context-upload'
                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                    onChange={handleContextFileUpload}
                    disabled={isUploading}
                  />
                  <div className='text-center'>
                    <div className='mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3'>
                      <Paperclip className='w-6 h-6 text-blue-600' />
                    </div>
                    <p className='text-sm font-medium text-gray-900 mb-1'>
                      {isUploading ? 'Uploading...' : 'Drop files here or click to upload'}
                    </p>
                    <p className='text-xs text-gray-500'>
                      Add reference materials, requirements, or mockups
                    </p>
                  </div>
                </div>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  {task.attachments?.filter(att => att.attachmentType === 'context').length ===
                  0 ? (
                    <div>
                      <FileText className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                      <p className='text-sm'>No reference materials yet</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Result Files (Employee uploads work results) */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <h4 className='text-sm font-medium text-gray-700'>Work Results</h4>
                <span className='text-xs text-gray-500'>• Deliverables from employee</span>
              </div>

              {userRole === 'employee' &&
              (task.status === 'in_progress' || task.status === 'completed') ? (
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                    dragActive && uploadType === 'result'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={e => handleDragEnter(e, 'result')}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type='file'
                    id='result-upload'
                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                    onChange={handleResultFileUpload}
                    disabled={isUploading}
                  />
                  <div className='text-center'>
                    <div className='mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3'>
                      <Upload className='w-6 h-6 text-green-600' />
                    </div>
                    <p className='text-sm font-medium text-gray-900 mb-1'>
                      {isUploading ? 'Uploading...' : 'Drop your work results here'}
                    </p>
                    <p className='text-xs text-gray-500'>
                      Upload completed work, deliverables, or final outputs
                    </p>
                  </div>
                </div>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  {task.attachments?.filter(att => att.attachmentType === 'result').length === 0 ? (
                    <div>
                      <FileText className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                      <p className='text-sm'>No work results yet</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Feedback Files (Admin uploads when rejecting) */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                <h4 className='text-sm font-medium text-gray-700'>Feedback & Revisions</h4>
                <span className='text-xs text-gray-500'>• Admin review notes</span>
              </div>

              <div className='text-center py-8 text-gray-500'>
                {task.attachments?.filter(att => att.attachmentType === 'feedback').length === 0 ? (
                  <div>
                    <FileText className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                    <p className='text-sm'>No feedback files yet</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Display all attachments in a modern grid */}
            {task.attachments && task.attachments.length > 0 && (
              <div className='space-y-4'>
                <div className='border-t pt-4'>
                  <h4 className='text-sm font-medium text-gray-700 mb-3'>Uploaded Files</h4>
                  <div className='grid gap-3'>
                    {task.attachments.map(attachment => {
                      const typeConfig = {
                        context: {
                          color: 'blue',
                          bg: 'bg-blue-50',
                          border: 'border-blue-200',
                          text: 'text-blue-700',
                          icon: 'text-blue-500',
                          label: 'Reference',
                        },
                        result: {
                          color: 'green',
                          bg: 'bg-green-50',
                          border: 'border-green-200',
                          text: 'text-green-700',
                          icon: 'text-green-500',
                          label: 'Result',
                        },
                        feedback: {
                          color: 'orange',
                          bg: 'bg-orange-50',
                          border: 'border-orange-200',
                          text: 'text-orange-700',
                          icon: 'text-orange-500',
                          label: 'Feedback',
                        },
                      }[attachment.attachmentType]

                      return (
                        <div
                          key={attachment.id}
                          className={`group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${typeConfig.bg} ${typeConfig.border}`}
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex items-start gap-3 flex-1 min-w-0'>
                              <div
                                className={`w-10 h-10 rounded-lg bg-white border flex items-center justify-center flex-shrink-0`}
                              >
                                <FileText className={`w-5 h-5 ${typeConfig.icon}`} />
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2 mb-1'>
                                  <p className={`text-sm font-medium truncate ${typeConfig.text}`}>
                                    {attachment.fileName}
                                  </p>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full bg-white ${typeConfig.text} font-medium`}
                                  >
                                    {typeConfig.label}
                                  </span>
                                </div>
                                <div className='flex items-center gap-2 text-xs text-gray-500'>
                                  <span>{(attachment.fileSize / 1024).toFixed(1)} KB</span>
                                  <span>•</span>
                                  <span>{attachment.uploadedAt.toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span className='capitalize'>{attachment.uploadedByRole}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size='sm'
                              variant='ghost'
                              className='opacity-0 group-hover:opacity-100 transition-opacity'
                              onClick={() => handleFileDownload(attachment)}
                            >
                              <Download className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {userRole === 'admin' && task.status === 'completed' && (
            <>
              <div className='space-y-4'>
                <h3 className='text-sm font-medium text-muted-foreground'>Review Task</h3>
                <Textarea
                  placeholder='Add a revision comment... (Required for revision request)'
                  value={revisionComment}
                  onChange={e => setRevisionComment(e.target.value)}
                />

                {/* Feedback File Upload for Rejection */}
                <div className='space-y-3'>
                  <label className='text-sm font-medium text-gray-700'>
                    Add Feedback Files (Optional)
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                      dragActive && uploadType === 'feedback'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
                    }`}
                    onDragEnter={e => handleDragEnter(e, 'feedback')}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      type='file'
                      id='feedback-upload'
                      className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                      onChange={handleFeedbackFileUpload}
                      disabled={isUploading}
                    />
                    <div className='text-center'>
                      <div className='mx-auto w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2'>
                        <Paperclip className='w-5 h-5 text-orange-600' />
                      </div>
                      <p className='text-sm font-medium text-gray-900 mb-1'>
                        {isUploading ? 'Uploading...' : 'Drop feedback files here'}
                      </p>
                      <p className='text-xs text-gray-500'>
                        Add images, markups, or documents to explain revisions
                      </p>
                    </div>
                  </div>
                </div>

                <div className='flex justify-end gap-2 mt-2'>
                  <Button
                    variant='destructive'
                    onClick={handleRequestRevision}
                    disabled={isSubmitting || !revisionComment.trim()}
                  >
                    <XCircle className='mr-2 h-4 w-4' />
                    Reject Task
                  </Button>
                  <Button onClick={handleApprove} disabled={isSubmitting}>
                    <CheckCircle className='mr-2 h-4 w-4' />
                    Approve Task
                  </Button>
                </div>
              </div>
            </>
          )}

          {userRole === 'employee' &&
            (task.status === 'rejected' || task.status === 'revision') && (
              <div className='flex justify-end'>
                <Button
                  onClick={async () => {
                    try {
                      setIsSubmitting(true)
                      await updateDoc(doc(db, 'tasks', task.id), {
                        status: 'in_progress',
                        updatedAt: serverTimestamp(),
                      })
                      // Refresh data to ensure UI reflects the latest state
                      if (onDataRefresh) {
                        await onDataRefresh()
                      }
                      onOpenChange(false)
                      toast({ title: 'Task resumed, please continue working!' })
                    } catch (err) {
                      toast({
                        title: 'Failed to update task status',
                        description: (err as any)?.message || 'An error occurred.',
                        variant: 'destructive',
                      })
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                  disabled={isSubmitting}
                >
                  Resume Task
                </Button>
              </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
