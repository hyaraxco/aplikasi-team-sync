'use client'

import { Badge } from '@/components/atomics/badge'
import { Button } from '@/components/atomics/button'
import { Skeleton } from '@/components/atomics/skeleton'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { EmptyState } from '@/components/molecules/data-display'
import { getTasks } from '@/lib/database'
import type { Task } from '@/types'
import { format } from 'date-fns'
import { CheckCircle2, Clock, ListTodo, MoreHorizontal, Zap } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface AllTasksOverviewWidgetProps {
  className?: string
}

/**
 * All Tasks Overview widget for admin dashboard
 * Shows system-wide task management with quick approval actions
 */
export function AllTasksOverviewWidget({ className = '' }: AllTasksOverviewWidgetProps) {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskStats, setTaskStats] = useState({
    pending: 0,
    inProgress: 0,
    inReview: 0,
    completed: 0,
    total: 0,
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!user || userRole !== 'admin') return

    try {
      setLoading(true)
      const tasksData = await getTasks(undefined, undefined, 'admin')

      // Calculate stats
      const stats = {
        pending: tasksData.filter(t => t.status === 'backlog').length,
        inProgress: tasksData.filter(t => t.status === 'in_progress').length,
        inReview: tasksData.filter(t => t.status === 'in_review').length,
        completed: tasksData.filter(t => t.status === 'done' || t.status === 'completed').length,
        total: tasksData.length,
      }
      setTaskStats(stats)

      // Get tasks that need attention (in review, overdue, high priority)
      const priorityTasks = tasksData
        .filter(task => {
          const isInReview = task.status === 'in_review'
          const isOverdue = task.deadline && task.deadline.toDate() < new Date()
          const isHighPriority = task.priority === 'high'
          return isInReview || isOverdue || isHighPriority
        })
        .sort((a, b) => {
          // Sort by: in_review first, then overdue, then high priority
          if (a.status === 'in_review' && b.status !== 'in_review') return -1
          if (b.status === 'in_review' && a.status !== 'in_review') return 1

          const aOverdue = a.deadline && a.deadline.toDate() < new Date()
          const bOverdue = b.deadline && b.deadline.toDate() < new Date()
          if (aOverdue && !bOverdue) return -1
          if (bOverdue && !aOverdue) return 1

          return 0
        })
        .slice(0, 5)

      setTasks(priorityTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [user, userRole])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleApproveTask = async (taskId: string) => {
    if (!user) return

    try {
      setActionLoading(taskId)
      await approveTask(taskId, user.uid)
      await fetchTasks() // Refresh tasks
    } catch (error) {
      console.error('Error approving task:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getTaskBadge = (task: Task) => {
    if (task.status === 'in_review') {
      return (
        <Badge variant='secondary' className='text-xs'>
          Needs Review
        </Badge>
      )
    }
    if (task.deadline && task.deadline.toDate() < new Date()) {
      return (
        <Badge variant='destructive' className='text-xs'>
          Overdue
        </Badge>
      )
    }
    if (task.priority === 'high') {
      return (
        <Badge variant='outline' className='text-xs border-orange-500 text-orange-600'>
          High Priority
        </Badge>
      )
    }
    return null
  }

  if (userRole !== 'admin') {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <ListTodo className='h-5 w-5' />
            All Tasks Overview
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
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-2'>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
            <div className='space-y-2'>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className='h-16 w-full' />
              ))}
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Task Statistics */}
            <div className='grid grid-cols-2 gap-2 text-center'>
              <div className='p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg'>
                <div className='text-lg font-bold text-blue-600'>{taskStats.inReview}</div>
                <div className='text-xs text-blue-600'>In Review</div>
              </div>
              <div className='p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg'>
                <div className='text-lg font-bold text-yellow-600'>{taskStats.inProgress}</div>
                <div className='text-xs text-yellow-600'>In Progress</div>
              </div>
              <div className='p-2 bg-green-50 dark:bg-green-950/30 rounded-lg'>
                <div className='text-lg font-bold text-green-600'>{taskStats.completed}</div>
                <div className='text-xs text-green-600'>Completed</div>
              </div>
              <div className='p-2 bg-gray-50 dark:bg-gray-950/30 rounded-lg'>
                <div className='text-lg font-bold text-gray-600'>{taskStats.total}</div>
                <div className='text-xs text-gray-600'>Total</div>
              </div>
            </div>

            {/* Priority Tasks */}
            <div>
              <h4 className='text-sm font-medium mb-2 flex items-center gap-1'>
                <Zap className='h-4 w-4 text-orange-500' />
                Needs Attention
              </h4>

              {tasks.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className='h-6 w-6 text-muted-foreground' />}
                  title='All good!'
                  description='No tasks need immediate attention.'
                />
              ) : (
                <div className='space-y-2'>
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      className='p-2 border rounded-lg hover:bg-muted/50 transition-colors'
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h5 className='text-sm font-medium truncate'>{task.name}</h5>
                            {getTaskBadge(task)}
                          </div>

                          {task.deadline && (
                            <div className='text-xs text-muted-foreground'>
                              Due {format(task.deadline.toDate(), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>

                        {task.status === 'in_review' && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleApproveTask(task.id)}
                            disabled={actionLoading === task.id}
                            className='text-xs h-7'
                          >
                            {actionLoading === task.id ? (
                              <Clock className='h-3 w-3 animate-spin' />
                            ) : (
                              <>
                                <CheckCircle2 className='h-3 w-3 mr-1' />
                                Approve
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
