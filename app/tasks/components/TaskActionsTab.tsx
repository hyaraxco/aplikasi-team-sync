'use client'

import { Button } from '@/components/atomics/button'
import { TaskAttachment } from '@/types'
import { AlertCircle, CheckCircle, Loader2, MessageSquare, Send, XCircle } from 'lucide-react'
import type { TaskCardProps } from '../section/TaskCard.section'
import { AdminReviewTextarea } from './AdminReviewTextarea'
import { EmployeeCommentTextarea } from './EmployeeCommentTextarea'
import { TaskFileSection } from './TaskFileSection'

interface TaskActionsTabProps {
  task: TaskCardProps
  canEmployeeSubmit: boolean
  canAdminReview: boolean
  employeeComment: string
  reviewComment: string
  feedbackFiles: File[]
  setFeedbackFiles: (files: File[]) => void
  handleEmployeeCommentChange: (value: string) => void
  handleReviewCommentChange: (value: string) => void
  handleFileDownload: (attachment: TaskAttachment) => void
  handleFileDelete: (attachment: TaskAttachment) => void
  handleEmployeeSubmit: () => void
  handleAdminReview: (status: 'done' | 'revision') => void
  isSubmitting: boolean
  userRole: 'admin' | 'employee' | null
}

export function TaskActionsTab({
  task,
  canEmployeeSubmit,
  canAdminReview,
  employeeComment,
  reviewComment,
  feedbackFiles,
  setFeedbackFiles,
  handleEmployeeCommentChange,
  handleReviewCommentChange,
  handleFileDownload,
  handleFileDelete,
  handleEmployeeSubmit,
  handleAdminReview,
  isSubmitting,
  userRole,
}: TaskActionsTabProps) {
  return (
    <div className='space-y-6'>
      {/* Employee Actions */}
      {canEmployeeSubmit && (
        <div className='p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 rounded-lg'>
          <div className='flex items-center gap-2 mb-3'>
            <Send className='h-5 w-5 text-green-600 dark:text-green-400' />
            Submit Work
          </div>
          <p className='text-sm text-green-700 dark:text-green-300 mb-4'>
            Ready to submit your completed work for review?
          </p>

          {/* Employee Comment Section */}
          <div className='mb-4'>
            <label
              htmlFor='employee-comment'
              className='text-sm font-medium text-green-900 dark:text-green-100 block mb-2'
            >
              Comments (Optional)
            </label>
            <EmployeeCommentTextarea
              initialValue={employeeComment}
              onChange={handleEmployeeCommentChange}
              disabled={isSubmitting}
              taskId={task.id}
            />
          </div>

          <Button
            onClick={handleEmployeeSubmit}
            disabled={isSubmitting}
            className='w-full bg-green-600 hover:bg-green-700'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Submitting...
              </>
            ) : (
              <>
                <Send className='mr-2 h-4 w-4' />
                Submit
              </>
            )}
          </Button>
        </div>
      )}

      {/* Admin Review Actions */}
      {canAdminReview && (
        <div className='space-y-4'>
          <div className='p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 rounded-lg'>
            <div className='flex items-center gap-2 mb-3'>
              <MessageSquare className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              <h4 className='font-medium text-blue-900 dark:text-blue-100'>Review Task</h4>
            </div>

            <div className='space-y-4'>
              <div>
                <label
                  htmlFor='review-comment'
                  className='text-sm font-medium text-blue-900 dark:text-blue-100'
                >
                  Review Comment
                </label>
                <AdminReviewTextarea
                  initialValue={reviewComment}
                  onChange={handleReviewCommentChange}
                  disabled={isSubmitting}
                  taskId={task.id}
                />
              </div>

              {/* Feedback Files Section */}
              <div className='space-y-2'>
                <h5 className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                  Feedback Files (Optional)
                </h5>
                <TaskFileSection
                  type='feedback'
                  attachments={task.attachments?.filter(a => a.attachmentType === 'feedback') || []}
                  canUpload={true}
                  onFileDownload={handleFileDownload}
                  onFileDelete={handleFileDelete}
                  onFilesChange={setFeedbackFiles}
                  uploadedFiles={feedbackFiles}
                  isSubmitting={isSubmitting}
                  userRole={userRole}
                  taskStatus={task.status}
                />
              </div>

              <div className='flex gap-2 mt-4'>
                <Button
                  onClick={() => handleAdminReview('revision')}
                  disabled={isSubmitting}
                  variant='outline'
                  className='flex-1 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30'
                >
                  {isSubmitting ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <XCircle className='mr-2 h-4 w-4' />
                  )}
                  Request Revision
                </Button>
                <Button
                  onClick={() => handleAdminReview('done')}
                  disabled={isSubmitting}
                  className='flex-1 bg-green-600 hover:bg-green-700'
                >
                  {isSubmitting ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <CheckCircle className='mr-2 h-4 w-4' />
                  )}
                  Approve Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Actions Available */}
      {!canEmployeeSubmit && !canAdminReview && (
        <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
          <AlertCircle className='h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500' />
          <p className='text-sm'>No actions available for this task</p>
          <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
            {task.status === 'done' ? 'Task has been completed' : 'Task is not ready for action'}
          </p>
        </div>
      )}
    </div>
  )
}
