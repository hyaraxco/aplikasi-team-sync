'use client'

import { Badge } from '@/components/atomics/badge'
import { Button } from '@/components/atomics/button'
import { Skeleton } from '@/components/atomics/skeleton'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { EmptyState } from '@/components/molecules/data-display'
import { getTasks, submitTaskForReview } from '@/lib/database'
import type { Task } from '@/types'
import { format } from 'date-fns'
import { AlertCircle, Calendar, CheckCircle2, Clock, ListTodo, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface MyTasksWidgetProps {
  className?: string
}

/**
 * My Tasks widget for employee dashboard
 * Shows assigned tasks with quick actions
 */
export function MyTasksWidget({ className = '' }: MyTasksWidgetProps) {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!user || userRole !== 'employee') return

    try {
      setLoading(true)
      const tasksData = await getTasks(user.uid, undefined, 'employee')
      // Filter for active tasks (not completed)
      const activeTasks = tasksData
        .filter(task => task.status !== 'done' && task.status !== 'completed')
        .sort((a, b) => {
          // Sort by priority and deadline
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0

          if (aPriority !== bPriority) return bPriority - aPriority

          // Then by deadline
          if (a.deadline && b.deadline) {
            return a.deadline.toMillis() - b.deadline.toMillis()
          }
          return 0
        })
        .slice(0, 5) // Show only top 5 tasks

      setTasks(activeTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [user, userRole])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleMarkComplete = async (taskId: string) => {
    if (!user) return

    try {
      setActionLoading(taskId)
      await submitTaskForReview(taskId, user.uid)
      await fetchTasks() // Refresh tasks
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <Badge variant='destructive' className='text-xs'>
            High
          </Badge>
        )
      case 'medium':
        return (
          <Badge variant='secondary' className='text-xs'>
            Medium
          </Badge>
        )
      case 'low':
        return (
          <Badge variant='outline' className='text-xs'>
            Low
          </Badge>
        )
      default:
        return (
          <Badge variant='outline' className='text-xs'>
            Normal
          </Badge>
        )
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Clock className='h-3 w-3 text-blue-500' />
      case 'in_review':
        return <AlertCircle className='h-3 w-3 text-yellow-500' />
      case 'backlog':
        return <ListTodo className='h-3 w-3 text-gray-500' />
      default:
        return <ListTodo className='h-3 w-3 text-gray-500' />
    }
  }

  const isOverdue = (deadline: any) => {
    if (!deadline) return false
    return deadline.toDate() < new Date()
  }

  if (userRole !== 'employee') {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <ListTodo className='h-5 w-5' />
            My Tasks
          </CardTitle>
          <Link href='/tasks'>
            <Button variant='ghost' size='sm'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='space-y-3'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className='h-8 w-8 text-muted-foreground' />}
            title='All caught up!'
            description='No active tasks assigned to you right now.'
          />
        ) : (
          <div className='space-y-3'>
            {tasks.map(task => (
              <div
                key={task.id}
                className='p-3 border rounded-lg hover:bg-muted/50 transition-colors'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      {getStatusIcon(task.status)}
                      <h4 className='text-sm font-medium truncate'>{task.name}</h4>
                      {getPriorityBadge(task.priority)}
                    </div>

                    {task.deadline && (
                      <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Calendar className='h-3 w-3' />
                        <span className={isOverdue(task.deadline) ? 'text-red-500' : ''}>
                          Due {format(task.deadline.toDate(), 'MMM dd')}
                          {isOverdue(task.deadline) && ' (Overdue)'}
                        </span>
                      </div>
                    )}
                  </div>

                  {task.status === 'in_progress' && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleMarkComplete(task.id)}
                      disabled={actionLoading === task.id}
                      className='text-xs h-7'
                    >
                      {actionLoading === task.id ? (
                        <Clock className='h-3 w-3 animate-spin' />
                      ) : (
                        <>
                          <CheckCircle2 className='h-3 w-3 mr-1' />
                          Submit
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {tasks.length === 5 && (
              <div className='pt-2 border-t'>
                <Link href='/tasks'>
                  <Button variant='ghost' size='sm' className='w-full text-xs'>
                    View all tasks
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
