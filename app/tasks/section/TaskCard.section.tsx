'use client'

import { Badge } from '@/components/atomics'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atomics/avatar'
import { Card, CardContent } from '@/components/molecules/card'
import { cn, getPriorityBadge } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar, CheckCircle, Clock, Eye, Hourglass, XCircle } from 'lucide-react'
import React from 'react'

export interface TaskCardAssignee {
  name: string
  avatar: string
  initials: string
}

export interface TaskCardProps {
  id: string
  name: string
  description?: string
  priority: string
  status: string
  dueDate: Date
  assignee?: TaskCardAssignee
  onClick?: () => void
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'revision'
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'backlog':
      return 'To Do'
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'For Review'
    case 'done':
      return 'Done'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}

const TaskCard: React.FC<TaskCardProps> = ({
  name,
  description,
  priority,
  status,
  dueDate,
  assignee,
  onClick,
  approvalStatus,
}) => {
  const isOverdue = status !== 'done' && new Date() > dueDate
  const priorityBadge = getPriorityBadge(priority as any)
  // Determine user role from context or props if needed
  // For this example, we'll use window.localStorage.getItem('userRole')
  let userRole: 'admin' | 'employee' = 'employee'
  if (typeof window !== 'undefined') {
    userRole = (window.localStorage.getItem('userRole') as any) || 'employee'
  }

  // Badge logic
  let badge = null
  if (userRole === 'admin') {
    if (status === 'completed') {
      badge = (
        <span className='flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium'>
          <Hourglass className='h-4 w-4' /> Pending Approval
        </span>
      )
    } else if (status === 'done') {
      badge = (
        <span className='flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium'>
          <CheckCircle className='h-4 w-4' /> Approved
        </span>
      )
    } else if (status === 'rejected') {
      badge = (
        <span className='flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium'>
          <XCircle className='h-4 w-4' /> Rejected
        </span>
      )
    }
  } else {
    // employee
    if (status === 'completed') {
      badge = (
        <span className='flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium'>
          <Eye className='h-4 w-4' /> In Review
        </span>
      )
    } else if (status === 'done') {
      badge = (
        <span className='flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium'>
          <CheckCircle className='h-4 w-4' /> Approved
        </span>
      )
    } else if (status === 'rejected') {
      badge = (
        <span className='flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium'>
          <XCircle className='h-4 w-4' /> Revision
        </span>
      )
    }
  }

  return (
    <Card className='cursor-pointer hover:shadow-md transition-shadow' onClick={onClick}>
      <CardContent className='p-4'>
        <div className='space-y-2'>
          <div className='flex justify-between items-start gap-2'>
            <h3 className='font-medium line-clamp-2'>{name}</h3>
            <Badge className={cn('text-xs font-normal', priorityBadge.color)}>{priority}</Badge>
          </div>

          {description && (
            <p className='text-sm text-muted-foreground line-clamp-2'>{description}</p>
          )}

          {/* Status Badge */}
          {badge && <div className='mt-2'>{badge}</div>}

          <div className='flex items-center justify-between pt-2'>
            <div className='flex items-center gap-2'>
              <Avatar className='h-6 w-6'>
                <AvatarImage
                  src={assignee?.avatar || '/placeholder.svg'}
                  alt={assignee?.name || '-'}
                />
                <AvatarFallback>{assignee?.initials || '-'}</AvatarFallback>
              </Avatar>
              <span className='text-xs text-muted-foreground'>{assignee?.name || '-'}</span>
            </div>
            <div className='flex items-center gap-1'>
              {isOverdue ? (
                <Clock className='h-3 w-3 text-red-500' />
              ) : (
                <Calendar className='h-3 w-3 text-muted-foreground' />
              )}
              <span
                className={cn(
                  'text-xs',
                  isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'
                )}
              >
                {format(dueDate, 'MMM d')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TaskCard
