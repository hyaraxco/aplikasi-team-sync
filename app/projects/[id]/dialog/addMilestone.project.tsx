'use client'

import { Button } from '@/components/atomics/button'
import { Calendar } from '@/components/atomics/calendar'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import { Textarea } from '@/components/atomics/textarea'
import { useAuth } from '@/components/auth-provider'
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
import { validateMilestoneOperation } from '@/lib/auth'
import { addMilestoneToProject, getProjectById } from '@/lib/database'
import { cn } from '@/lib/ui'
import type { Milestone } from '@/types'
import { format } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface AddMilestoneDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onMilestoneAdded: () => void
}

export function AddMilestoneDialog({
  isOpen,
  onClose,
  projectId,
  onMilestoneAdded,
}: AddMilestoneDialogProps) {
  const { user, userRole } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState<'not-started' | 'in-progress' | 'completed' | 'overdue'>(
    'not-started'
  )
  // Progress will be calculated automatically based on related tasks
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDueDate(undefined)
    setStatus('not-started')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required')
      return false
    }
    if (!dueDate) {
      setError('Due date is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!user) {
      setError('You must be logged in to add a milestone')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Get project data for validation
      const project = await getProjectById(projectId)
      if (!project) {
        setError('Project not found')
        return
      }

      // Create milestone object for validation
      const milestoneData = {
        title: title.trim(),
        description: description.trim(),
        dueDate: Timestamp.fromDate(dueDate as Date),
        status,
        // Progress will be calculated automatically based on related tasks
      }

      // Validate milestone operation using business rules
      const validation = validateMilestoneOperation(milestoneData, project, {
        userId: user.uid,
        userRole: userRole || 'employee',
        projectId,
      })

      if (!validation.valid) {
        setError(validation.reason || 'Cannot create milestone')
        return
      }

      // Additional business validations
      if (project.status === 'completed') {
        setError('Cannot add milestones to completed projects')
        return
      }

      const milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'> = milestoneData

      await addMilestoneToProject(projectId, milestone)

      toast.success('Milestone added successfully')
      onMilestoneAdded()
      handleClose()
    } catch (error: any) {
      console.error('Error adding milestone:', error)
      setError(error.message || 'Failed to add milestone')
      toast.error('Failed to add milestone')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Add New Milestone</DialogTitle>
          <DialogDescription>
            Create a new milestone to track project progress and important deadlines.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          {error && <div className='text-sm font-medium text-destructive'>{error}</div>}

          <div className='space-y-2'>
            <Label htmlFor='title'>Title</Label>
            <Input
              id='title'
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder='Enter milestone title'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='Enter milestone description'
              rows={3}
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='dueDate'>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {dueDate ? format(dueDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar mode='single' selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={status}
                onValueChange={value =>
                  setStatus(value as 'not-started' | 'in-progress' | 'completed' | 'overdue')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='not-started'>Not Started</SelectItem>
                  <SelectItem value='in-progress'>In Progress</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='overdue'>Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <div className='p-3 bg-blue-50 border border-blue-200 rounded-md'>
              <p className='text-sm text-blue-800'>
                <strong>Note:</strong> Progress will be calculated automatically based on completed
                tasks with deadlines on or before this milestone's due date.
              </p>
            </div>
          </div>

          <DialogFooter className='pt-4'>
            <Button variant='outline' type='button' onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Adding...
                </>
              ) : (
                'Add Milestone'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
