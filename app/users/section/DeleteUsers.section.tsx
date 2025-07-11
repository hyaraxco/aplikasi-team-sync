'use client'

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
import { ActivityActionType, addActivity, updateUserData, type UserData } from '@/lib/firestore'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// Helper untuk styling tombol destructive jika tidak ada ButtonVariants global. Tidak dipakai saat ini.
// const getButtonDestructiveClassName = () => {
//   return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
// };

interface DeactivateUserDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  userToDeactivate: UserData | null
  onUserDeactivated: () => void
}

export default function DeactivateUserDialog({
  isOpen,
  onOpenChange,
  userToDeactivate,
  onUserDeactivated,
}: DeactivateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user: adminUser } = useAuth()

  const handleDeactivate = async () => {
    if (!adminUser) {
      toast.error('Admin not authenticated. Please re-login.')
      return
    }
    if (!userToDeactivate) {
      toast.error('No user selected for deactivation.')
      return
    }

    if (adminUser.uid === userToDeactivate.id && userToDeactivate.role === 'admin') {
      toast.error('Admin cannot deactivate their own account.')
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)
    try {
      await updateUserData(userToDeactivate.id, { status: 'inactive' })

      await addActivity({
        userId: adminUser.uid,
        type: 'user',
        action: ActivityActionType.USER_DEACTIVATED,
        targetId: userToDeactivate.id,
        targetName: userToDeactivate.displayName || userToDeactivate.email,
        status: 'unread',
        details: {
          message: `${adminUser.displayName || adminUser.email} deactivated user: ${userToDeactivate.displayName || userToDeactivate.email}.`,
          adminActor: adminUser.displayName || adminUser.email,
          deactivatedUserName: userToDeactivate.displayName || userToDeactivate.email,
          newStatus: 'inactive',
        },
      })

      toast.success(`User ${userToDeactivate.displayName || userToDeactivate.email} deactivated.`)
      onUserDeactivated()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error deactivating user:', error)
      toast.error(error.message || 'Failed to deactivate user.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !userToDeactivate) {
    // Jika dialog tidak seharusnya terbuka atau tidak ada user, jangan render
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate User Confirmation</DialogTitle>
          <DialogDescription className='py-2'>
            User:{' '}
            <strong className='font-semibold'>
              {userToDeactivate.displayName || userToDeactivate.email}
            </strong>{' '}
            ({userToDeactivate.email})
            <br />
            This action will set the user's status to "inactive". They will not be able to log in or
            access the application until their status is changed back to "active".
            <br />
            <br />
            <strong>Are you sure you want to proceed?</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeactivate} disabled={isSubmitting} variant='destructive'>
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isSubmitting ? 'Deactivating...' : 'Deactivate User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
