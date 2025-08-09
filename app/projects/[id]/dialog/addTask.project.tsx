'use client'

import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import { Textarea } from '@/components/atomics/textarea'
import { useAuth } from '@/components/auth-provider'
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
import { createTask, getUsers, updateTask } from '@/lib/database'
import { StorageServiceFactory } from '@/lib/storage-service'
import { cn, formatRupiah, parseCurrencyInput } from '@/lib/ui'
import type { Task, TaskAttachment, TaskPriority, TaskStatus, UserData } from '@/types'
import { Timestamp } from 'firebase/firestore'
import { Check, Loader2, UserPlus } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface AddTaskDialogProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  onTaskAdded?: (taskId: string) => void
}

export const AddTaskDialog = ({ projectId, isOpen, onClose, onTaskAdded }: AddTaskDialogProps) => {
  const { user } = useAuth()
  const { toast } = useToast()

  // Form state
  const [taskName, setTaskName] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium')
  const [taskStatus] = useState<TaskStatus>('backlog') // Admin always creates tasks in backlog status
  const [taskDeadline, setTaskDeadline] = useState<Date | null>(null)
  const [taskRate, setTaskRate] = useState<number>(0)
  const [assignedTo, setAssignedTo] = useState<string>('')
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

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTaskName('')
      setTaskDescription('')
      setTaskPriority('medium')
      setTaskDeadline(null)
      setTaskRate(0)
      setAssignedTo('')
      setFilesToUpload([])
      setError(null)
    }
  }, [isOpen])

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

    if (!user) {
      setError('User not authenticated')
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
      // 1. Create task data without attachments first
      const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        name: taskName.trim(),
        projectId,
        status: taskStatus,
        priority: taskPriority,
        deadline: Timestamp.fromDate(taskDeadline),
        createdBy: user.uid,
        attachments: [], // Start with empty attachments
        ...(taskDescription.trim() && { description: taskDescription.trim() }),
        ...(assignedTo && { assignedTo: [assignedTo] }),
        ...(taskRate > 0 && { taskRate }),
      }

      // 2. Create the task in Firestore to get a taskId
      const taskId = await createTask(taskData)

      // 3. If there are files, upload them now with the taskId
      if (filesToUpload.length > 0) {
        const storageService = StorageServiceFactory.getService()
        const uploadedAttachments: TaskAttachment[] = []

        for (const file of filesToUpload) {
          const result = await storageService.upload(file, `tasks/${taskId}`, 'context')

          uploadedAttachments.push({
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

        // 4. Update the task with the attachment info
        await updateTask(taskId, { attachments: uploadedAttachments })
      }

      toast({
        title: 'Success',
        description: 'Task created successfully',
      })

      onTaskAdded?.(taskId)
      onClose()
    } catch (error) {
      console.error('Error creating task:', error)
      setError('Failed to create task. Please try again.')
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedUser = users.find(u => u.id === assignedTo)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-full max-w-lg max-h-[90dvh] overflow-auto'>
        <DialogHeader>
          <DialogTitle>Tambah Task Baru</DialogTitle>
          <DialogDescription>Fill in the details below to create a new task.</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-4'>
          <form id='add-task-form' onSubmit={handleSubmit} className='space-y-6'>
            {/* Task Name */}
            <div className='grid gap-2'>
              <Label htmlFor='taskName'>Title *</Label>
              <Input
                id='taskName'
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                placeholder='Enter task title'
                required
              />
            </div>

            {/* Task Description */}
            <div className='grid gap-2'>
              <Label htmlFor='taskDescription'>Deskripsi</Label>
              <Textarea
                id='taskDescription'
                value={taskDescription}
                onChange={e => setTaskDescription(e.target.value)}
                placeholder='Enter task description (optional)'
                rows={3}
              />
            </div>

            {/* Priority and Status Info */}
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
                <Label htmlFor='deadline'>Due Date *</Label>
                <DatePicker
                  value={taskDeadline}
                  onChange={date => setTaskDeadline(date)}
                  placeholder='Select due date'
                  className='w-full'
                />
              </div>
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
            <div className='grid gap-2'>
              <Label htmlFor='attachments'>Lampiran Awal (Opsional)</Label>
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
            form='add-task-form'
            disabled={loading || !taskName.trim() || !taskDeadline}
          >
            {loading ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Creating...
              </>
            ) : (
              'Simpan Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddTaskDialog
