'use client'

import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import { Textarea } from '@/components/atomics/textarea'
import { useAuth } from '@/components/auth-provider'
import { FileIcon } from '@/components/files/FileIcon'
import { FileUpload } from '@/components/files/FileUpload'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/molecules/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/molecules/select'
import { useToast } from '@/hooks'
import { getUsers, updateTask } from '@/lib/database'
import { StorageServiceFactory } from '@/lib/storage-service'
import { cn, formatRupiah, parseCurrencyInput } from '@/lib/ui'
import type { Task, TaskAttachment, TaskPriority, TaskStatus, UserData } from '@/types'
import { Timestamp } from 'firebase/firestore'
import { Check, Loader2, Trash2, UserPlus } from 'lucide-react'
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
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [filesToUpload, setFilesToUpload] = useState<File[]>([])

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
      setAttachments(task.attachments || [])
      setFilesToUpload([])
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

  const removeExistingAttachment = async (attachmentId: string) => {
    const attachment = attachments.find(att => att.id === attachmentId)
    if (!attachment) return

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${attachment.fileName}"? This action cannot be undone.`
    )
    if (!confirmed) return

    try {
      // Delete from Cloudinary storage
      const storageService = StorageServiceFactory.getService()
      const deleteSuccess = await storageService.delete(attachment)

      if (!deleteSuccess) {
        console.warn('Failed to delete file from storage, but continuing with local removal')
      }

      // Remove from local state
      setAttachments(prev => prev.filter(att => att.id !== attachmentId))

      toast({
        title: 'File Deleted',
        description: `${attachment.fileName} has been removed.`,
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: 'Deletion Failed',
        description: 'Could not delete the file. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !task) {
      setError('User not authenticated or task not found')
      return
    }
    if (!taskName.trim() || !taskDeadline) {
      setError('Task name and deadline are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let finalAttachments = [...attachments]

      // Upload new files if any
      if (filesToUpload.length > 0) {
        const storageService = StorageServiceFactory.getService()
        const newUploadedAttachments: TaskAttachment[] = []
        for (const file of filesToUpload) {
          const result = await storageService.upload(file, `tasks/${task.id}`, 'context')
          newUploadedAttachments.push({
            id: result.publicId,
            publicId: result.publicId,
            fileName: file.name,
            fileUrl: result.url,
            secureUrl: result.secureUrl,
            fileSize: result.fileSize,
            fileType: file.type,
            uploadedBy: user.uid,
            uploadedByRole: 'admin',
            uploadedAt: Timestamp.now(),
            attachmentType: 'context',
            storageProvider: 'cloudinary',
          })
        }
        finalAttachments = [...finalAttachments, ...newUploadedAttachments]
      }

      const taskData: Partial<Task> = {
        name: taskName.trim(),
        status: taskStatus,
        priority: taskPriority,
        deadline: Timestamp.fromDate(taskDeadline),
        description: taskDescription.trim(),
        assignedTo: assignedTo ? [assignedTo] : [],
        taskRate: taskRate,
        attachments: finalAttachments,
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
      <DialogContent className='w-full max-w-lg max-h-[90dvh] overflow-auto'>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update task details, assignment, and attachments.</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-4'>
          <form id='edit-task-form' onSubmit={handleSubmit} className='space-y-6'>
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
                          {status.replace(/_/g, ' ').charAt(0).toUpperCase() +
                            status.replace(/_/g, ' ').slice(1)}
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
              <Label htmlFor='taskRate'>Task Rate (IDR)</Label>
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

            {/* Attachments Section */}
            <div className='space-y-4'>
              <Label>Attachments</Label>
              {attachments.length > 0 && (
                <div className='space-y-2'>
                  {attachments.map(att => (
                    <div
                      key={att.id}
                      className='flex items-center justify-between p-2 border rounded-lg bg-gray-50 dark:bg-gray-800'
                    >
                      <div className='flex items-center gap-3 flex-grow min-w-0'>
                        <FileIcon filename={att.fileName} className='h-6 w-6 flex-shrink-0' />
                        <div className='flex-grow min-w-0'>
                          <p className='text-sm font-medium truncate'>{att.fileName}</p>
                          <p className='text-xs text-muted-foreground'>
                            {(att.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => removeExistingAttachment(att.id)}
                        className='h-8 w-8 text-red-500 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <FileUpload
                onFilesChange={setFilesToUpload}
                maxFileSize={5 * 1024 * 1024} // 5MB
                maxFiles={5}
                acceptedFileTypes={[
                  // Documents
                  'application/pdf',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                  'application/vnd.ms-powerpoint',
                  'text/plain',
                  'text/csv',
                  // Images
                  'image/png',
                  'image/jpeg',
                  'image/jpg',
                  'image/gif',
                  'image/webp',
                  'image/bmp',
                  'image/svg+xml',
                  // Archives
                  'application/zip',
                  'application/x-rar-compressed',
                  'application/x-7z-compressed',
                ]}
                className='w-full'
              />
            </div>

            {error && <div className='text-red-500 text-sm'>{error}</div>}
          </form>
        </div>

        <DialogFooter className='pt-4 mt-4'>
          <Button variant='outline' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type='submit'
            form='edit-task-form'
            disabled={loading || !taskName.trim() || !taskDeadline}
          >
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
