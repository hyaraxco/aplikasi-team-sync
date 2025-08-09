'use client'

import { TaskAttachment } from '@/types'
import type { TaskCardProps } from '../section/TaskCard.section'
import { TaskFileSection } from './TaskFileSection'

interface TaskFilesTabProps {
  task: TaskCardProps
  userRole: 'admin' | 'employee' | null
  resultFiles: File[]
  contextFiles: File[]
  setResultFiles: (files: File[]) => void
  setContextFiles: (files: File[]) => void
  handleFileDownload: (attachment: TaskAttachment) => void
  handleFileDelete: (attachment: TaskAttachment) => void
  handleContextFileUpload: () => void
  isSubmitting: boolean
  canEmployeeSubmit: boolean
  canAdminReview: boolean
}

export function TaskFilesTab({
  task,
  userRole,
  resultFiles,
  contextFiles,
  setResultFiles,
  setContextFiles,
  handleFileDownload,
  handleFileDelete,
  handleContextFileUpload,
  isSubmitting,
  canEmployeeSubmit,
  canAdminReview,
}: TaskFilesTabProps) {
  const canUploadResults = userRole === 'employee' && canEmployeeSubmit
  // Hide context upload when task is in_progress, completed or done
  const canUploadContext =
    userRole === 'admin' &&
    task.status !== 'in_progress' &&
    task.status !== 'completed' &&
    task.status !== 'done'

  // Show result files visibility logic - fix for employee view
  const showResultFiles =
    (userRole === 'employee' && task.status !== 'backlog' && task.status !== 'todo') || // Employees see result files from in_progress onwards
    (userRole === 'admin' && ['completed', 'revision', 'rejected', 'done'].includes(task.status)) // Admins see result files in these statuses

  // Show feedback files for revision/rejected tasks (read-only in Files tab)
  const showFeedbackFiles =
    task.status === 'revision' || task.status === 'rejected' || task.status === 'done'

  return (
    <div className='space-y-4'>
      {/* Always show context files */}
      <TaskFileSection
        type='context'
        attachments={task.attachments?.filter(a => a.attachmentType === 'context') || []}
        canUpload={canUploadContext}
        onFileDownload={handleFileDownload}
        onFileDelete={handleFileDelete}
        onFilesChange={setContextFiles}
        uploadedFiles={contextFiles}
        onUpload={handleContextFileUpload}
        isSubmitting={isSubmitting}
        userRole={userRole}
        taskStatus={task.status}
      />

      {/* Show result files based on role and status */}
      {showResultFiles && (
        <TaskFileSection
          type='result'
          attachments={task.attachments?.filter(a => a.attachmentType === 'result') || []}
          canUpload={canUploadResults}
          onFileDownload={handleFileDownload}
          onFileDelete={handleFileDelete}
          onFilesChange={setResultFiles}
          uploadedFiles={resultFiles}
          isSubmitting={isSubmitting}
          userRole={userRole}
          taskStatus={task.status}
        />
      )}

      {/* Show feedback files in read-only mode for revision/rejected tasks */}
      {showFeedbackFiles && (
        <TaskFileSection
          type='feedback'
          attachments={task.attachments?.filter(a => a.attachmentType === 'feedback') || []}
          canUpload={false} // Always read-only in Files tab
          onFileDownload={handleFileDownload}
          onFileDelete={handleFileDelete}
          onFilesChange={() => {}} // No-op for read-only
          uploadedFiles={[]} // No files being uploaded in read-only mode
          isSubmitting={isSubmitting}
          userRole={userRole}
          taskStatus={task.status}
        />
      )}
    </div>
  )
}
