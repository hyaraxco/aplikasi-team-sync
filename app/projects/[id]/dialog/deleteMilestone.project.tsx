'use client'

import { Button } from '@/components/atomics/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/molecules/dialog'
import { deleteMilestone } from '@/lib/database'
import { Milestone } from '@/types'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface DeleteMilestoneDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  milestone: Milestone
  onMilestoneDeleted: () => void
}

export function DeleteMilestoneDialog({
  isOpen,
  onClose,
  projectId,
  milestone,
  onMilestoneDeleted,
}: DeleteMilestoneDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await deleteMilestone(projectId, milestone.id)

      toast.success('Milestone deleted successfully')
      onMilestoneDeleted()
      onClose()
    } catch (error: any) {
      console.error('Error deleting milestone:', error)
      setError(error.message || 'Failed to delete milestone')
      toast.error('Failed to delete milestone')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Delete Milestone</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this milestone? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <div className='rounded-md bg-muted p-4'>
            <h4 className='font-medium'>{milestone.title}</h4>
            {milestone.description && (
              <p className='text-sm text-muted-foreground mt-1'>{milestone.description}</p>
            )}
          </div>

          {error && <div className='text-sm font-medium text-destructive mt-4'>{error}</div>}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={handleDelete} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Deleting...
              </>
            ) : (
              'Delete Milestone'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
