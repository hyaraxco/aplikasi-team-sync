'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/molecules/avatar'
import { format } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  User,
  XCircle,
} from 'lucide-react'
import type { TaskCardProps } from '../section/TaskCard.section'

interface TaskOverviewTabProps {
  task: TaskCardProps
}

export function TaskOverviewTab({ task }: TaskOverviewTabProps) {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'done':
        return <CheckCircle className='h-5 w-5 text-green-500' />
      case 'rejected':
        return <XCircle className='h-5 w-5 text-red-500' />
      case 'revision':
        return <AlertCircle className='h-5 w-5 text-orange-500' />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (task.status) {
      case 'done':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      case 'rejected':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      case 'revision':
        return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
      default:
        return 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800'
    }
  }

  return (
    <div className='grid gap-4'>
      {/* Task Details Card */}
      <div className='bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-800'>
          <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>Task Details</h3>
        </div>
        <div className='p-6 space-y-6'>
          {/* Assigned To */}
          <div className='flex items-start gap-4'>
            <div className='p-2 bg-gray-100 dark:bg-gray-800 rounded-lg'>
              <User className='h-4 w-4 text-gray-600 dark:text-gray-400' />
            </div>
            <div className='flex-1'>
              <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'>
                Assigned To
              </p>
              <div className='flex items-center gap-3'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={task.assignee?.avatar} />
                  <AvatarFallback className='text-xs'>{task.assignee?.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    {task.assignee?.name}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>Employee</p>
                </div>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className='flex items-start gap-4'>
            <div className='p-2 bg-gray-100 dark:bg-gray-800 rounded-lg'>
              <Calendar className='h-4 w-4 text-gray-600 dark:text-gray-400' />
            </div>
            <div className='flex-1'>
              <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'>Due Date</p>
              <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                {format(task.dueDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className='flex items-start gap-4'>
              <div className='p-2 bg-gray-100 dark:bg-gray-800 rounded-lg'>
                <FileText className='h-4 w-4 text-gray-600 dark:text-gray-400' />
              </div>
              <div className='flex-1'>
                <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'>
                  Description
                </p>
                <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                  {task.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Notes Card */}
      {task.employeeComment && (
        <div className='bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-950/20'>
            <div className='flex items-center gap-2'>
              <MessageSquare className='h-4 w-4 text-blue-600 dark:text-blue-400' />
              <h3 className='text-sm font-semibold text-blue-900 dark:text-blue-100'>
                Employee Notes
              </h3>
            </div>
          </div>
          <div className='p-6'>
            <div className='bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
              <p className='text-sm text-blue-900 dark:text-blue-100 leading-relaxed'>
                {task.employeeComment}
              </p>
              <div className='mt-3 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300'>
                <Clock className='h-3 w-3' />
                <span>Submitted with task</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Feedback Card - Comprehensive Section */}
      {task.reviewComment && (
        <div
          className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border overflow-hidden ${getStatusColor()}`}
        >
          <div className={`px-6 py-4 border-b ${getStatusColor()}`}>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {getStatusIcon()}
                <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                  Admin Review
                </h3>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  task.status === 'done'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                    : task.status === 'rejected'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                }`}
              >
                {task.status === 'done'
                  ? 'Approved'
                  : task.status === 'rejected'
                    ? 'Rejected'
                    : 'Needs Revision'}
              </span>
            </div>
          </div>

          <div className='p-6'>
            {/* Admin Info */}
            <div className='flex items-start gap-4 mb-4'>
              <Avatar className='h-10 w-10'>
                <AvatarImage src='/admin-avatar.png' />
                <AvatarFallback className='bg-gray-200 dark:bg-gray-700 text-xs'>AD</AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                  Administrator
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Reviewed on {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>

            {/* Review Comment */}
            <div className={`rounded-lg p-4 ${getStatusColor()}`}>
              <p
                className={`text-sm leading-relaxed ${
                  task.status === 'done'
                    ? 'text-green-900 dark:text-green-100'
                    : task.status === 'rejected'
                      ? 'text-red-900 dark:text-red-100'
                      : 'text-orange-900 dark:text-orange-100'
                }`}
              >
                {task.reviewComment}
              </p>
            </div>

            {/* Action Required Notice - Only for revision/rejected */}
            {(task.status === 'revision' || task.status === 'rejected') && (
              <div className='mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg'>
                <p className='text-xs font-medium text-gray-700 dark:text-gray-300'>
                  {task.status === 'revision'
                    ? '⚡ Action Required: Please review the feedback and submit revised work.'
                    : '❌ This task has been rejected. Please contact your administrator for next steps.'}
                </p>
              </div>
            )}

            {/* Approval Notice - Only for approved */}
            {task.status === 'done' && (
              <div className='mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg'>
                <p className='text-xs font-medium text-green-700 dark:text-green-300'>
                  ✅ This task has been approved and marked as complete.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
