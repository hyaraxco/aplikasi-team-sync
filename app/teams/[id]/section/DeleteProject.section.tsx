'use client'

import { Button, Spinner } from '@/components/atomics'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/molecules/dialog'
import type { Project } from '@/lib/firestore'

interface DeleteProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  onDelete: () => void
  isLoading?: boolean
  teamName: string
}

export function DeleteProjectDialog({
  isOpen,
  onClose,
  project,
  onDelete,
  isLoading,
  teamName,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className='gap-2'>
          <DialogTitle>Remove Project from Team</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove the project <b>{project?.name}</b> from the team{' '}
            <b>{teamName}</b>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={onDelete} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className='mr-2 w-4 h-4' />
                Removing...
              </>
            ) : (
              'Remove'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
