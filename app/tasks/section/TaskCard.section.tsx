'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/molecules'
import { Card, CardContent } from '@/components/molecules/card'
import { cn } from '@/lib/ui'
import { TaskAttachment } from '@/types'
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
  milestone?: {
    id: string
    title: string
    dueDate: Date
  }
  attachments?: TaskAttachment[]
  employeeComment?: string
  reviewComment?: string
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
  milestone,
}) => {
  const isOverdue = status !== 'done' && new Date() > dueDate
  // Import the utility function inline to avoid import issues
  const { getTaskPriorityBadgeConfig } = require('@/lib/ui')
  const priorityBadge = getTaskPriorityBadgeConfig(priority as any)
  // Determine user role from context or props if needed
  // For this example, we'll use window.localStorage.getItem('userRole')
  let userRole: 'admin' | 'employee' = 'employee'
  if (typeof window !== 'undefined') {
    userRole = (window.localStorage.getItem('userRole') as any) || 'employee'
  }

  // Badge logic using centralized utility
  let badge = null

  // Only show badges for specific statuses that need visual indication
  if (['completed', 'done', 'rejected', 'revision'].includes(status)) {
    // Import the utility function inline to avoid import issues
    const { getTaskStatusBadgeConfig } = require('@/lib/ui')
    const badgeConfig = getTaskStatusBadgeConfig(status as any, userRole)

    // Icon mapping for different statuses
    const iconMap = {
      completed: userRole === 'admin' ? Hourglass : Eye,
      done: CheckCircle,
      rejected: XCircle, // Consolidated: same icon as revision
      revision: XCircle, // Consolidated: same icon as rejected
    }

    const IconComponent = iconMap[status as keyof typeof iconMap]

    badge = (
      <span className={badgeConfig.className}>
        {IconComponent && <IconComponent className='h-4 w-4' />} {badgeConfig.text}
      </span>
    )
  }

  return (
    <Card className='cursor-pointer hover:shadow-md transition-shadow' onClick={onClick}>
      <CardContent className='p-4'>
        <div className='space-y-2'>
          <div className='flex justify-between items-start gap-2'>
            <h3 className='font-medium line-clamp-2'>{name}</h3>
            <span className={priorityBadge.className}>{priorityBadge.text}</span>
          </div>

          {description && (
            <p className='text-sm text-muted-foreground line-clamp-2'>{description}</p>
          )}

          {/* Milestone Badge */}
          {milestone && (
            <div className='mt-2'>
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                📍 {milestone.title}
              </span>
            </div>
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
