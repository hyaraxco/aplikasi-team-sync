'use client'

import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
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
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useRef, useState } from 'react'

import { DatePicker } from '@/components/molecules/AntDatePicker'
import { useToast } from '@/hooks/use-toast'
import { ProjectPriority, ProjectStatus, Timestamp, updateProject } from '@/lib/firestore'
import { Loader2 } from 'lucide-react'

interface EditProjectDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  project: {
    id: string
    name: string
    description?: string
    deadline: Timestamp
    status: ProjectStatus
    priority: ProjectPriority
    budget: number
  }
  onProjectUpdated?: (project: any) => void
}

export function EditProjectDialog({
  isOpen,
  onOpenChange,
  project,
  onProjectUpdated,
}: EditProjectDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [deadline, setDeadline] = useState<Timestamp>(project.deadline)
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [budget, setBudget] = useState<number>(project.budget)
  const [budgetInput, setBudgetInput] = useState<string>(
    project.budget ? project.budget.toLocaleString('id-ID') : ''
  )
  const budgetInputRef = useRef<HTMLInputElement>(null)
  const [priority, setPriority] = useState<ProjectPriority>(project.priority)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    description?: string
    deadline?: string
    budget?: string
    status?: string
    priority?: string
  }>({})

  const validateForm = () => {
    const newErrors: {
      name?: string
      description?: string
      deadline?: string
      budget?: string
      status?: string
      priority?: string
    } = {}
    if (!name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (name.length > 50) {
      newErrors.name = 'Project name must be less than 50 characters'
    }
    if (description && description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }
    if (!deadline) {
      newErrors.deadline = 'Deadline is required'
    }
    if (!budget) {
      newErrors.budget = 'Budget is required'
    }
    if (!status) {
      newErrors.status = 'Status is required'
    }
    if (!priority) {
      newErrors.priority = 'Priority is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      const updatedProject = await updateProject(project.id, {
        name,
        description,
        deadline,
        status,
        priority,
        budget: budget ?? 0,
      })
      toast({
        title: 'Project updated',
        description: 'The project has been updated successfully.',
      })
      if (onProjectUpdated) onProjectUpdated(updatedProject)
      router.refresh()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[525px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details and team assignments.</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name' className='flex items-center justify-between'>
                Project Name
                {errors.name && <span className='text-xs text-destructive'>{errors.name}</span>}
              </Label>
              <Input
                id='name'
                value={name}
                onChange={e => setName(e.target.value)}
                required
                disabled={isSubmitting}
                className={errors.name ? 'border-destructive' : ''}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='description' className='flex items-center justify-between'>
                Description
                {errors.description && (
                  <span className='text-xs text-destructive'>{errors.description}</span>
                )}
              </Label>
              <Textarea
                id='description'
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isSubmitting}
                className={errors.description ? 'border-destructive' : ''}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='priority'>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={value => setPriority(value as ProjectPriority)}
                >
                  <SelectTrigger id='priority'>
                    <SelectValue placeholder='Select priority' />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ProjectPriority).map(p => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='status'>Status</Label>
                <Select value={status} onValueChange={value => setStatus(value as ProjectStatus)}>
                  <SelectTrigger id='status'>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ProjectStatus).map(s => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='deadline' className='flex items-center justify-between'>
                  Deadline
                  {errors.deadline && (
                    <span className='text-xs text-destructive'>{errors.deadline}</span>
                  )}
                </Label>
                <DatePicker
                  value={deadline ? deadline.toDate() : null}
                  onChange={date => {
                    if (date) setDeadline(Timestamp.fromDate(date))
                  }}
                  disabled={isSubmitting}
                  placeholder='Select deadline'
                />
              </div>
              <div className='grid gap-2 relative'>
                <Label htmlFor='budget' className='flex items-center justify-between'>
                  Budget
                  {errors.budget && (
                    <span className='text-xs text-destructive'>{errors.budget}</span>
                  )}
                </Label>

                <Input
                  id='budget'
                  type='text'
                  inputMode='numeric'
                  value={budgetInput}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '')
                    const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                    setBudgetInput(formatted)
                    setBudget(Number(raw))
                  }}
                  min={0}
                  required
                  disabled={isSubmitting}
                  ref={budgetInputRef}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 w-4 h-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
