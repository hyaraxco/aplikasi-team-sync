'use client'

import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atomics/popover'
import { useAuth } from '@/components/auth-provider'
import { DatePicker } from '@/components/molecules/AntDatePicker'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/molecules/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/molecules/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks'
import {
  getUsers,
  Timestamp,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type UserData,
} from '@/lib/firestore'
import { cn, formatRupiah, parseCurrencyInput } from '@/lib/utils'
import { Check, Loader2, UserPlus } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface EditTaskDialogProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onTaskUpdated?: (taskId: string) => void
}

export const EditTaskDialog = ({ task, isOpen, onClose, onTaskUpdated }: EditTaskDialogProps) => {
  const { user } = useAuth()
  const { toast } = useToast()

  // Form state
  const [taskName, setTaskName] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium')
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('backlog')
  const [taskDeadline, setTaskDeadline] = useState<Date | null>(null)
  const [taskRate, setTaskRate] = useState<number>(0)
  const [assignedTo, setAssignedTo] = useState<string>('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false)

  // Fetch users for assignment
  useEffect(() => {
    async function fetchUsers() {
      if (!isOpen) return

      setUsersLoading(true)
      try {
        const allUsers = await getUsers()
        setUsers(allUsers)
      } catch (error) {
        console.error('Error fetching users:', error)
        setError('Failed to load users')
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [isOpen])

  // Populate form when task changes
  useEffect(() => {
    if (isOpen && task) {
      setTaskName(task.name || '')
      setTaskDescription(task.description || '')
      setTaskPriority(task.priority || 'medium')
      setTaskStatus(task.status || 'backlog')
      setTaskDeadline(task.deadline ? task.deadline.toDate() : null)
      setTaskRate(task.taskRate || 0)
      setAssignedTo(task.assignedTo && task.assignedTo.length > 0 ? task.assignedTo[0] || '' : '')
      setError(null)
    }
  }, [isOpen, task])

  // Handle currency input formatting
  const handleTaskRateChange = (value: string) => {
    const numericValue = parseCurrencyInput(value)
    const numValue = Number(numericValue)

    if (numericValue === '' || numValue === 0) {
      setTaskRate(0)
    } else {
      setTaskRate(numValue)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !task) {
      setError('User not authenticated or task not found')
      return
    }

    if (!taskName.trim()) {
      setError('Task name is required')
      return
    }

    if (!taskDeadline) {
      setError('Deadline is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Import updateTask function dynamically
      const { updateTask } = await import('@/lib/firestore')

      const taskData: Partial<Task> = {
        name: taskName.trim(),
        status: taskStatus,
        priority: taskPriority,
        deadline: Timestamp.fromDate(taskDeadline),
        ...(taskDescription.trim() && { description: taskDescription.trim() }),
        ...(assignedTo && { assignedTo: [assignedTo] }),
        ...(taskRate > 0 && { taskRate }),
      }

      await updateTask(task.id, taskData)

      toast({
        title: 'Success',
        description: 'Task updated successfully',
      })

      onTaskUpdated?.(task.id)
      onClose()
    } catch (error) {
      console.error('Error updating task:', error)
      setError('Failed to update task. Please try again.')
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedUser = users.find(u => u.id === assignedTo)

  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-full max-w-lg max-h-[90dvh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update task details and assignment.</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Task Name */}
            <div className='grid gap-2'>
              <Label htmlFor='taskName'>Task Name *</Label>
              <Input
                id='taskName'
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                placeholder='Enter task name'
                required
              />
            </div>

            {/* Task Description */}
            <div className='grid gap-2'>
              <Label htmlFor='taskDescription'>Description</Label>
              <Textarea
                id='taskDescription'
                value={taskDescription}
                onChange={e => setTaskDescription(e.target.value)}
                placeholder='Enter task description (optional)'
                rows={3}
              />
            </div>

            {/* Priority and Status */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='priority'>Priority *</Label>
                <Select
                  value={taskPriority}
                  onValueChange={(value: TaskPriority) => setTaskPriority(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select priority' />
                  </SelectTrigger>
                  <SelectContent>
                    {['low', 'medium', 'high'].map(priority => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='status'>Status *</Label>
                <Select
                  value={taskStatus}
                  onValueChange={(value: TaskStatus) => setTaskStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    {['backlog', 'in_progress', 'completed', 'revision', 'done', 'blocked'].map(
                      status => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ').charAt(0).toUpperCase() +
                            status.replace('_', ' ').slice(1)}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Deadline */}
            <div className='grid gap-2'>
              <Label htmlFor='deadline'>Deadline *</Label>
              <DatePicker
                value={taskDeadline}
                onChange={date => setTaskDeadline(date)}
                placeholder='Select deadline'
                className='w-full'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='taskRate'>Task Rate (IDR) *</Label>
              <Input
                id='taskRate'
                type='text'
                value={formatRupiah(taskRate)}
                onChange={e => handleTaskRateChange(e.target.value)}
                placeholder='0'
              />
            </div>

            {/* Assign To */}
            <div className='grid gap-2'>
              <Label htmlFor='assignee'>Assign To *</Label>
              <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={assigneePopoverOpen}
                    className='justify-between'
                    disabled={usersLoading}
                  >
                    {selectedUser ? (
                      <span>{selectedUser.displayName || selectedUser.email}</span>
                    ) : (
                      <span className='text-muted-foreground'>Select assignee</span>
                    )}
                    <UserPlus className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-full p-0'>
                  <Command>
                    <CommandInput placeholder='Search users...' />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setAssignedTo('')
                            setAssigneePopoverOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              !assignedTo ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          Unassigned
                        </CommandItem>
                        {users.map(user => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => {
                              setAssignedTo(user.id)
                              setAssigneePopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                user.id === assignedTo ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {user.displayName || user.email}
                            {user.position && (
                              <span className='text-xs text-muted-foreground ml-1'>
                                ({user.position})
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {error && <div className='text-red-500 text-sm'>{error}</div>}
          </form>
        </div>

        <DialogFooter className='pt-2'>
          <Button variant='outline' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !taskName.trim() || !taskDeadline}>
            {loading ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Updating...
              </>
            ) : (
              'Update Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditTaskDialog
