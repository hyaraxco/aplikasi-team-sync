'use client'

import { Button } from '@/components/atomics/button'
import { Card, CardContent } from '@/components/molecules/card'
import { Checkbox } from '@radix-ui/react-checkbox'
import { Calendar, Edit } from 'lucide-react'
import React from 'react'
import type { TaskCardProps } from './TaskCard.section'

interface TaskListViewProps {
  tasks: TaskCardProps[]
  onTaskClick: (task: TaskCardProps) => void
  userRole?: 'admin' | 'employee'
}

const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onTaskClick,
  userRole = 'employee',
}) => {
  const formatDate = (deadline: Date) => {
    return deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Sort tasks: done, rejected, and revision tasks at the bottom, others by creation date
  const sortedTasks = [...tasks].sort((a, b) => {
    const aIsFinished = a.status === 'done' || a.status === 'rejected' || a.status === 'revision'
    const bIsFinished = b.status === 'done' || b.status === 'rejected' || b.status === 'revision'

    // If one task is finished and the other is not, finished goes to bottom
    if (aIsFinished && !bIsFinished) return 1
    if (!aIsFinished && bIsFinished) return -1

    // Otherwise sort by due date
    return a.dueDate.getTime() - b.dueDate.getTime()
  })

  if (tasks.length === 0) {
    return (
      <div className='flex items-center justify-center h-[200px] border border-dashed rounded-lg'>
        <p className='text-muted-foreground text-sm'>No tasks found</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {sortedTasks.map(task => (
        <Card key={task.id} className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-start gap-3'>
              <Checkbox
                checked={task.status === 'completed' || task.status === 'done'}
                disabled
                className='mt-1'
              />
              <div className='flex-1 space-y-2'>
                <div className='flex items-start justify-between'>
                  <h4
                    className={`font-medium ${
                      task.status === 'completed' || task.status === 'done'
                        ? 'text-muted-foreground line-through'
                        : ''
                    }`}
                  >
                    {task.name}
                  </h4>
                  <div className='flex gap-2 ml-4'>
                    {(() => {
                      // Import the utility function inline
                      const { getTaskStatusBadgeConfig } = require('@/lib/ui')
                      const statusBadge = getTaskStatusBadgeConfig(task.status as any, userRole)
                      return <span className={statusBadge.className}>{statusBadge.text}</span>
                    })()}
                    {(() => {
                      // Import the utility function inline
                      const { getTaskPriorityBadgeConfig } = require('@/lib/ui')
                      const priorityBadge = getTaskPriorityBadgeConfig(task.priority as any)
                      return <span className={priorityBadge.className}>{priorityBadge.text}</span>
                    })()}
                  </div>
                </div>
                <p className='text-sm text-muted-foreground'>{task.description}</p>
                <div className='flex items-center justify-between pt-2'>
                  <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                    <span>Assigned to: {task.assignee?.name || 'Unassigned'}</span>
                    {task.milestone && (
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                        📍 {task.milestone.title}
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                      <Calendar className='w-4 h-4' />
                      <span>{formatDate(task.dueDate)}</span>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onTaskClick(task)}
                      className='h-8 w-8 p-0'
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default TaskListView
