'use client'

import { useState } from 'react'
// Using regular Dialog for now, switch to AlertDialog if available
import { Button } from '@/components/atomics/button'
import { useAuth } from '@/components/auth-provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/molecules/dialog'
import { type UserData, activateUser } from '@/lib/database' // activateUser sudah ada
import { toast } from 'sonner'

interface ReactivateUserDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  userToReactivate: UserData | null
  onUserReactivated: () => void // Callback after success
}

export default function ReactivateUserDialog({
  isOpen,
  onOpenChange,
  userToReactivate,
  onUserReactivated,
}: ReactivateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user: adminUser } = useAuth()

  const handleReactivate = async () => {
    if (!adminUser) {
      toast.error('Admin not authenticated. Please re-login.')
      return
    }
    if (!userToReactivate) {
      toast.error('No user selected for reactivation.')
      return
    }

    setIsSubmitting(true)
    try {
      // Fungsi activateUser akan menangani perubahan status menjadi "active"
      // dan pembuatan activity log.
      await activateUser(adminUser.uid, userToReactivate.id)

      toast.success(
        `User ${userToReactivate.displayName || userToReactivate.email} reactivated successfully.`
      )
      onUserReactivated()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error reactivating user:', error)
      toast.error(error.message || 'Failed to reactivate user.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !userToReactivate) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reactivate User Confirmation</DialogTitle>
          <DialogDescription className='py-2'>
            User:{' '}
            <strong className='font-semibold'>
              {userToReactivate.displayName || userToReactivate.email}
            </strong>{' '}
            ({userToReactivate.email})
            <br />
            This action will set the user's status to "active". They will be able to log in and
            access the application again.
            <br />
            <br />
            <strong>Are you sure you want to proceed?</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReactivate}
            disabled={isSubmitting}
            className='bg-green-600 hover:bg-green-700 text-white' // Styling untuk tombol utama
          >
            {isSubmitting ? 'Reactivating...' : 'Reactivate User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
