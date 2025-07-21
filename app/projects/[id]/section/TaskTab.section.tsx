'use client'

import { Button } from '@/components/atomics/button'
import { Card, CardContent } from '@/components/molecules/card'
import { Checkbox } from '@radix-ui/react-checkbox'
import { Calendar, Edit, ListIcon, Plus } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { Skeleton } from '@/components/atomics/skeleton'
import { useAuth } from '@/components/auth-provider'
import { EmptyState } from '@/components/molecules/data-display/EmptyState'
import { getTasks, getUserData } from '@/lib/database'
import { getTaskPriorityBadge, getTaskStatusBadge } from '@/lib/ui'
import type { Task, TaskStatus, UserData } from '@/types'
import AddTaskDialog from '../dialog/addTask.project'
import EditTaskDialog from '../dialog/editTask.project'

interface TasksTabProps {
  projectId: string
}

export const TasksTab: React.FC<TasksTabProps> = ({ projectId }) => {
  const { userRole } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<Record<string, UserData>>({})
  const [milestones, setMilestones] = useState<any[]>([])
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false)
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true)
      setError(null)
      try {
        const fetchedTasks = await getTasks(undefined, projectId, 'admin')

        setTasks(fetchedTasks)

        // Fetch user data for assignees
        const userIds = Array.from(new Set(fetchedTasks.flatMap(t => t.assignedTo || [])))
        const userMap: Record<string, UserData> = {}
        await Promise.all(
          userIds.map(async uid => {
            const user = await getUserData(uid)
            if (user) userMap[uid] = user
          })
        )
        setUsers(userMap)

        // Fetch project milestones
        try {
          const { getProjectById } = await import('@/lib/database')
          const project = await getProjectById(projectId)
          if (project && project.milestones) {
            setMilestones(project.milestones)
          }
        } catch (error) {
          console.error('Error fetching milestones:', error)
        }
      } catch (e) {
        setError('Failed to load tasks')
      } finally {
        setLoading(false)
      }
    }
    if (projectId) fetchTasks()
  }, [projectId])

  const formatDate = (deadline: any) => {
    if (!deadline) return '-'
    const date = deadline.toDate ? deadline.toDate() : new Date(deadline)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get milestone that this task contributes to
  const getTaskMilestone = (task: Task) => {
    if (!milestones.length) return null

    const taskDeadline = task.deadline.toDate()

    // Find milestones that this task contributes to (task deadline <= milestone due date)
    const contributingMilestones = milestones.filter((milestone: any) => {
      const milestoneDate = milestone.dueDate.toDate()
      return taskDeadline <= milestoneDate
    })

    // Return the earliest milestone this task contributes to
    if (contributingMilestones.length > 0) {
      return contributingMilestones.sort(
        (a: any, b: any) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime()
      )[0]
    }

    return null
  }

  // Sort tasks: done, rejected, and revision tasks at the bottom, others by creation date
  const sortedTasks = [...tasks].sort((a, b) => {
    const aIsFinished = a.status === 'done' || a.status === 'rejected' || a.status === 'revision'
    const bIsFinished = b.status === 'done' || b.status === 'rejected' || b.status === 'revision'

    // If one task is finished and the other is not, finished goes to bottom
    if (aIsFinished && !bIsFinished) return 1
    if (!aIsFinished && bIsFinished) return -1

    // If both are finished or both are not finished, sort by creation date (newest first)
    return b.createdAt.toMillis() - a.createdAt.toMillis()
  })

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setEditTaskDialogOpen(true)
  }

  const handleTaskAdded = async (taskId: string) => {
    // Refresh the tasks list after a new task is added
    setLoading(true)
    try {
      const fetchedTasks = await getTasks(undefined, projectId, 'admin')
      setTasks(fetchedTasks)

      // Update users map if needed
      const userIds = Array.from(new Set(fetchedTasks.flatMap(t => t.assignedTo || [])))
      const userMap: Record<string, UserData> = {}
      await Promise.all(
        userIds.map(async uid => {
          const user = await getUserData(uid)
          if (user) userMap[uid] = user
        })
      )
      setUsers(userMap)
    } catch (e) {
      setError('Failed to refresh tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleTaskUpdated = async (taskId: string) => {
    // Refresh the tasks list after a task is updated
    setLoading(true)
    try {
      const fetchedTasks = await getTasks(undefined, projectId, 'admin')
      setTasks(fetchedTasks)

      // Update users map if needed
      const userIds = Array.from(new Set(fetchedTasks.flatMap(t => t.assignedTo || [])))
      const userMap: Record<string, UserData> = {}
      await Promise.all(
        userIds.map(async uid => {
          const user = await getUserData(uid)
          if (user) userMap[uid] = user
        })
      )
      setUsers(userMap)
    } catch (e) {
      setError('Failed to refresh tasks')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-xl font-semibold'>Project Tasks</h3>
          <p className='text-muted-foreground'>Manage and track project tasks</p>
        </div>
        {userRole === 'admin' && (
          <Button className='flex items-center gap-2' onClick={() => setAddTaskDialogOpen(true)}>
            <Plus className='w-4 h-4' />
            Add Task
          </Button>
        )}
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className='grid gap-4'>
          <Skeleton className='w-full h-[100px] rounded-md' />
          <Skeleton className='w-full h-[100px] rounded-md' />
          <Skeleton className='w-full h-[100px] rounded-md' />
          <Skeleton className='w-full h-[100px] rounded-md' />
        </div>
      ) : error ? (
        <div className='text-red-500'>{error}</div>
      ) : (
        <div className='grid gap-4'>
          {tasks.length === 0 ? (
            <EmptyState
              icon={<ListIcon />}
              title='No tasks found'
              description='No tasks found for this project.'
            />
          ) : (
            sortedTasks.map(task => (
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
                          className={`font-medium ${task.status === 'completed' || task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}
                        >
                          {task.name}
                        </h4>
                        <div className='flex gap-2 ml-4'>
                          {(() => {
                            const statusBadge = getTaskStatusBadge(task.status as TaskStatus)
                            return (
                              <span
                                className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white capitalize'
                                style={{
                                  backgroundColor: statusBadge.hexColor,
                                }}
                              >
                                {task.status.replace('_', ' ')}
                              </span>
                            )
                          })()}
                          {(() => {
                            const priorityBadge = getTaskPriorityBadge(task.priority)

                            return (
                              <span
                                className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white capitalize'
                                style={{
                                  backgroundColor: priorityBadge.hexColor,
                                }}
                              >
                                {task.priority || 'No Priority'}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                      <p className='text-sm text-muted-foreground'>{task.description}</p>
                      <div className='flex items-center justify-between pt-2'>
                        <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                          <span>
                            Assigned to:{' '}
                            {task.assignedTo && task.assignedTo.length > 0
                              ? task.assignedTo
                                  .map(uid => users[uid]?.displayName || uid)
                                  .join(', ')
                              : 'Unassigned'}
                          </span>
                          {(() => {
                            const milestone = getTaskMilestone(task)
                            return milestone ? (
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                                📍 {milestone.title}
                              </span>
                            ) : null
                          })()}
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                            <Calendar className='w-4 h-4' />
                            <span>{formatDate(task.deadline)}</span>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEditTask(task)}
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
            ))
          )}
        </div>
      )}

      {/* Add Task Dialog */}
      <AddTaskDialog
        projectId={projectId}
        isOpen={addTaskDialogOpen}
        onClose={() => setAddTaskDialogOpen(false)}
        onTaskAdded={handleTaskAdded}
      />

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={selectedTask}
        isOpen={editTaskDialogOpen}
        onClose={() => {
          setEditTaskDialogOpen(false)
          setSelectedTask(null)
        }}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  )
}
