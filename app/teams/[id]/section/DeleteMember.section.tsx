'use client'

import { Button, Spinner } from '@/components/atomics'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/molecules'
import type { EnrichedTeamMember } from './MemberTable.section'

interface DeleteMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  member: EnrichedTeamMember | null
  onDelete: () => void
  isLoading?: boolean
  errorMessage?: string
}

export function DeleteMemberDialog({
  isOpen,
  onClose,
  member,
  onDelete,
  isLoading,
  errorMessage,
}: DeleteMemberDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className='gap-2'>
          <DialogTitle>Remove Member from Team</DialogTitle>
          <DialogDescription>
            {errorMessage ? (
              <span className='text-red-500 font-semibold'>{errorMessage}</span>
            ) : (
              <>
                Are you sure you want to remove <b>{member?.userData?.displayName}</b> from the
                team?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {!errorMessage && (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
