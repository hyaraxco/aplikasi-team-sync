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
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Spinner } from '@/components/atomics/spinner'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onDelete: () => Promise<void>
  redirectPath?: string
}

export function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onDelete,
  redirectPath,
}: DeleteConfirmDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await onDelete()

      toast({
        title: 'Deleted successfully',
        description: `${title} has been deleted.`,
      })

      onOpenChange(false)

      if (redirectPath) {
        router.push(redirectPath)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast({
        title: 'Error',
        description: `Failed to delete ${title.toLowerCase()}. Please try again.`,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button type='button' variant='destructive' onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner className='mr-2 w-4 h-4' />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
