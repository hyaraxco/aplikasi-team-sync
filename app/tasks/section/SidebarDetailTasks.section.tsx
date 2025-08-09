'use client'

import { Badge } from '@/components/atomics/badge'
import { Separator } from '@/components/molecules/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/molecules/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/molecules/tabs'
import { useToast } from '@/hooks'
import { auth, db } from '@/lib/firebase'
import { downloadFile, StorageServiceFactory } from '@/lib/storage-service'
import { getTaskPriorityBadgeConfig, getTaskStatusBadgeConfig } from '@/lib/ui'
import { TaskAttachment, TaskPriority, TaskStatus } from '@/types'
import { format } from 'date-fns'
import { doc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore'
import { Calendar, Paperclip, Send, User } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { TaskActionsTab } from '../components/TaskActionsTab'
import { TaskFilesTab } from '../components/TaskFilesTab'
import { TaskOverviewTab } from '../components/TaskOverviewTab'
import type { TaskCardProps } from './TaskCard.section'

interface SidebarDetailTasksProps {
  task: TaskCardProps | null
  isOpen: boolean
  userRole: 'admin' | 'employee' | null
  onOpenChange: (isOpen: boolean) => void
  onDataRefresh?: () => Promise<void>
}

export function SidebarDetailTasks({
  task,
  isOpen,
  userRole,
  onOpenChange,
  onDataRefresh,
}: SidebarDetailTasksProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // States for file management
  const [resultFiles, setResultFiles] = useState<File[]>([])
  const [feedbackFiles, setFeedbackFiles] = useState<File[]>([])
  const [contextFiles, setContextFiles] = useState<File[]>([])
  const [reviewComment, setReviewComment] = useState('')
  const [employeeComment, setEmployeeComment] = useState('')

  // Track the current task ID to detect task changes
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

  // Ref to access the uncontrolled textarea value when needed
  const employeeCommentRef = useRef<string>('')

  // Stable onChange handlers to prevent re-renders
  const handleEmployeeCommentChange = useCallback((value: string) => {
    employeeCommentRef.current = value // Store in ref for submission
    setEmployeeComment(value) // Keep state for reset logic
  }, [])

  const handleReviewCommentChange = useCallback((value: string) => {
    setReviewComment(value)
  }, [])

  // Reset state only when switching to a different task
  useEffect(() => {
    if (isOpen && task && task.id !== currentTaskId) {
      // Only reset when opening dialog for a different task
      setResultFiles([])
      setFeedbackFiles([])
      setContextFiles([])
      setReviewComment('')
      setEmployeeComment('')
      employeeCommentRef.current = '' // Reset ref as well
      setActiveTab('overview')
      setCurrentTaskId(task.id)
    }
  }, [isOpen, task?.id, currentTaskId])

  // Reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setResultFiles([])
      setFeedbackFiles([])
      setContextFiles([])
      setReviewComment('')
      setEmployeeComment('')
      employeeCommentRef.current = '' // Reset ref when dialog closes
      setCurrentTaskId(null)
    }
  }, [isOpen])

  if (!task) return null

  // Business logic helpers
  const canEmployeeSubmit =
    userRole === 'employee' && (task.status === 'in_progress' || task.status === 'revision')

  const canAdminReview = userRole === 'admin' && task.status === 'completed'

  // Show feedback section for rejected/revision tasks even without files (to show comments)
  const shouldShowFeedback =
    task.status === 'revision' ||
    task.status === 'rejected' ||
    (task.attachments?.filter(a => a.attachmentType === 'feedback').length || 0) > 0

  const handleFileDownload = async (attachment: TaskAttachment) => {
    try {
      await downloadFile(attachment)
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download Error',
        description: 'An error occurred while downloading the file.',
        variant: 'destructive',
      })
    }
  }

  // Handle file deletion with role-based permissions
  const handleFileDelete = async (attachment: TaskAttachment) => {
    if (!task || !auth.currentUser) return

    // Role-based deletion permissions
    const canDelete =
      // Admin can delete their own files, but NOT on approved tasks
      (userRole === 'admin' && attachment.uploadedByRole === 'admin' && task.status !== 'done') ||
      // Employee can delete result files only during work (not after approval)
      (userRole === 'employee' &&
        attachment.uploadedByRole === 'employee' &&
        attachment.attachmentType === 'result' &&
        (task.status === 'in_progress' ||
          task.status === 'revision' ||
          task.status === 'rejected')) ||
      // Special case: Admin can delete feedback files on rejected tasks (for re-review)
      (userRole === 'admin' &&
        attachment.uploadedByRole === 'admin' &&
        attachment.attachmentType === 'feedback' &&
        (task.status === 'revision' || task.status === 'rejected'))

    if (!canDelete) {
      toast({
        title: 'Permission Denied',
        description: 'You cannot delete this file.',
        variant: 'destructive',
      })
      return
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${attachment.fileName}"? This action cannot be undone.`
    )
    if (!confirmed) return

    setIsSubmitting(true)
    try {
      // Delete from Cloudinary storage
      const storageService = StorageServiceFactory.getService()
      const deleteSuccess = await storageService.delete(attachment)

      if (!deleteSuccess) {
        throw new Error('Failed to delete file from storage')
      }

      // Remove from Firestore
      const updatedAttachments = (task.attachments || []).filter(att => att.id !== attachment.id)

      await updateDoc(doc(db, 'tasks', task.id), {
        attachments: updatedAttachments,
        updatedAt: serverTimestamp(),
      })

      toast({
        title: 'File Deleted',
        description: `${attachment.fileName} has been deleted successfully.`,
      })

      onDataRefresh?.()
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: 'Deletion Failed',
        description: 'Could not delete the file. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Employee action to submit work
  const handleEmployeeSubmit = async () => {
    if (!task) return
    setIsSubmitting(true)
    try {
      const storageService = StorageServiceFactory.getService()
      const uploadedAttachments: TaskAttachment[] = task.attachments ? [...task.attachments] : []

      for (const file of resultFiles) {
        const result = await storageService.upload(file, `tasks/${task.id}`, 'result')
        uploadedAttachments.push({
          id: result.publicId,
          publicId: result.publicId,
          fileName: file.name,
          fileUrl: result.url,
          secureUrl: result.secureUrl,
          fileSize: result.fileSize,
          fileType: file.type,
          uploadedBy: auth.currentUser?.uid || 'unknown',
          uploadedByRole: 'employee',
          uploadedAt: Timestamp.now(),
          attachmentType: 'result',
          storageProvider: 'cloudinary',
        })
      }

      await updateDoc(doc(db, 'tasks', task.id), {
        status: 'completed', // 'completed' is the "Submitted" status
        attachments: uploadedAttachments,
        updatedAt: serverTimestamp(),
        ...(employeeCommentRef.current.trim() && {
          employeeComment: employeeCommentRef.current.trim(),
        }),
      })

      toast({ title: 'Task Submitted', description: 'Your work has been submitted for review.' })
      onDataRefresh?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting task:', error)
      toast({
        title: 'Submission Failed',
        description: 'Could not submit your work.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle admin context file upload
  const handleContextFileUpload = async () => {
    if (!task || contextFiles.length === 0) return

    setIsSubmitting(true)
    try {
      const storageService = StorageServiceFactory.getService()
      const uploadedAttachments: TaskAttachment[] = task.attachments ? [...task.attachments] : []

      for (const file of contextFiles) {
        const result = await storageService.upload(file, `tasks/${task.id}`, 'context')
        uploadedAttachments.push({
          id: result.publicId,
          publicId: result.publicId,
          fileName: file.name,
          fileUrl: result.url,
          secureUrl: result.secureUrl,
          fileSize: result.fileSize,
          fileType: file.type,
          uploadedBy: auth.currentUser?.uid || 'unknown',
          uploadedByRole: 'admin',
          uploadedAt: Timestamp.now(),
          attachmentType: 'context',
          storageProvider: 'cloudinary',
        })
      }

      await updateDoc(doc(db, 'tasks', task.id), {
        attachments: uploadedAttachments,
        updatedAt: serverTimestamp(),
      })

      toast({
        title: 'Context Files Uploaded',
        description: 'Reference materials have been added to the task.',
      })
      setContextFiles([])

      // Update the task object directly to reflect new attachments
      // This prevents navigation and ensures immediate UI update
      if (task) {
        task.attachments = uploadedAttachments
      }

      // Optional: Call onDataRefresh without await to prevent navigation
      onDataRefresh?.().catch(console.error)
    } catch (error) {
      console.error('Error uploading context files:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload context files. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Admin action to save review
  const handleAdminReview = async (status: 'done' | 'revision') => {
    if (!task) return
    setIsSubmitting(true)
    try {
      const storageService = StorageServiceFactory.getService()
      const finalAttachments: TaskAttachment[] = task.attachments ? [...task.attachments] : []

      if (feedbackFiles.length > 0) {
        for (const file of feedbackFiles) {
          const result = await storageService.upload(file, `tasks/${task.id}`, 'feedback')
          finalAttachments.push({
            id: result.publicId,
            publicId: result.publicId,
            fileName: file.name,
            fileUrl: result.url,
            secureUrl: result.secureUrl,
            fileSize: result.fileSize,
            fileType: file.type,
            uploadedBy: auth.currentUser?.uid || 'unknown',
            uploadedByRole: 'admin',
            uploadedAt: Timestamp.now(),
            attachmentType: 'feedback',
            storageProvider: 'cloudinary',
          })
        }
      }

      await updateDoc(doc(db, 'tasks', task.id), {
        status: status,
        attachments: finalAttachments,
        updatedAt: serverTimestamp(),
        ...(status === 'revision' && { reviewComment: reviewComment }),
      })

      toast({ title: 'Review Saved', description: `Task has been marked as ${status}.` })
      onDataRefresh?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving review:', error)
      toast({
        title: 'Review Failed',
        description: 'Could not save the review.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const priorityBadge = getTaskPriorityBadgeConfig(task.priority as TaskPriority)
  const statusBadge = getTaskStatusBadgeConfig(task.status as TaskStatus, userRole || 'employee')

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-lg overflow-y-auto'>
        <SheetHeader className='space-y-1 pb-4'>
          <div className='flex justify-between items-start gap-2'>
            <SheetTitle className='text-lg flex-1'>{task.name}</SheetTitle>
            <div className='flex gap-2'>
              <span className={priorityBadge.className}>{priorityBadge.text}</span>
              <Badge
                className={statusBadge.className.replace(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                  ''
                )}
              >
                {statusBadge.text}
              </Badge>
            </div>
          </div>
          <SheetDescription className='flex items-center gap-2 text-xs'>
            <Calendar className='h-3.5 w-3.5' />
            Due {format(task.dueDate, 'PPP')}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        {/* Unified Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full mt-4'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='overview' className='flex items-center gap-2'>
              <User className='h-4 w-4' />
              Overview
            </TabsTrigger>
            <TabsTrigger value='files' className='flex items-center gap-2'>
              <Paperclip className='h-4 w-4' />
              Files
            </TabsTrigger>
            <TabsTrigger value='actions' className='flex items-center gap-2'>
              <Send className='h-4 w-4' />
              Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='mt-6'>
            <TaskOverviewTab task={task} />
          </TabsContent>

          <TabsContent value='files' className='mt-6'>
            <TaskFilesTab
              task={task}
              userRole={userRole}
              resultFiles={resultFiles}
              contextFiles={contextFiles}
              setResultFiles={setResultFiles}
              setContextFiles={setContextFiles}
              handleFileDownload={handleFileDownload}
              handleFileDelete={handleFileDelete}
              handleContextFileUpload={handleContextFileUpload}
              isSubmitting={isSubmitting}
              canEmployeeSubmit={canEmployeeSubmit}
              canAdminReview={canAdminReview}
            />
          </TabsContent>

          <TabsContent value='actions' className='mt-6'>
            <TaskActionsTab
              task={task}
              canEmployeeSubmit={canEmployeeSubmit}
              canAdminReview={canAdminReview}
              employeeComment={employeeComment}
              reviewComment={reviewComment}
              feedbackFiles={feedbackFiles}
              setFeedbackFiles={setFeedbackFiles}
              handleEmployeeCommentChange={handleEmployeeCommentChange}
              handleReviewCommentChange={handleReviewCommentChange}
              handleFileDownload={handleFileDownload}
              handleFileDelete={handleFileDelete}
              handleEmployeeSubmit={handleEmployeeSubmit}
              handleAdminReview={handleAdminReview}
              isSubmitting={isSubmitting}
              userRole={userRole}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
