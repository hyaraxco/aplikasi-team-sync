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
import { addActivity, deleteUserRecord } from '@/lib/database'
import type { UserData } from '@/types'
import { ActivityActionType } from '@/types/database'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface HardDeleteUserDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  userToDelete: UserData | null
  onUserHardDeleted: () => void // Callback after successful deletion
}

export default function HardDeleteUserDialog({
  isOpen,
  onOpenChange,
  userToDelete,
  onUserHardDeleted,
}: HardDeleteUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user: adminUser } = useAuth()

  const handleHardDelete = async () => {
    if (!adminUser) {
      toast.error('Admin not authenticated. Please re-login.')
      return
    }
    if (!userToDelete) {
      toast.error('No user selected for deletion.')
      return
    }

    // Pencegahan agar admin tidak bisa menghapus dirinya sendiri
    if (adminUser.uid === userToDelete.id && userToDelete.role === 'admin') {
      toast.error('Admin cannot permanently delete their own account through this dialog.')
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)
    try {
      // Hapus record dari Firestore
      await deleteUserRecord(userToDelete.id)

      // Tambahkan log aktivitas
      await addActivity({
        userId: adminUser.uid,
        type: 'user',
        action: ActivityActionType.USER_PERMANENTLY_DELETED, // Aksi baru
        targetId: userToDelete.id,
        targetName: userToDelete.displayName || userToDelete.email,
        status: 'unread',
        details: {
          message: `Admin ${adminUser.displayName || adminUser.email} permanently deleted user: ${userToDelete.displayName || userToDelete.email}.`,
          adminActor: adminUser.displayName || adminUser.email,
          deletedUserName: userToDelete.displayName || userToDelete.email,
        },
      })

      toast.success(
        `User ${userToDelete.displayName || userToDelete.email} permanently deleted from Firestore.`
      )

      // PENTING: Beri tahu pengguna bahwa akun Auth mungkin masih ada
      toast.info(
        'Firebase Authentication account may still exist and require manual deletion from Firebase Console or a backend process if not automated.',
        { duration: 10000 }
      )

      onUserHardDeleted() // Panggil callback
      onOpenChange(false) // Tutup dialog
    } catch (error: any) {
      console.error('Error permanently deleting user:', error)
      toast.error(error.message || 'Failed to permanently delete user.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !userToDelete) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center'>
            <AlertTriangle className='mr-2 h-6 w-6 text-red-600' />
            Confirm Permanent Deletion
          </DialogTitle>
          <DialogDescription className='py-2 text-base'>
            You are about to <strong>permanently delete</strong> the user:
            <br />
            <strong className='font-semibold text-red-600'>
              {userToDelete.displayName || userToDelete.email}
            </strong>{' '}
            ({userToDelete.email}).
            <br />
            <br />
            This action is irreversible and will remove the user's data from the application's
            database (Firestore).
            <br />
            <br />
            <strong className='text-red-700'>
              Important: Deleting the user from Firebase Authentication (if not handled by a
              separate backend process) must be done manually via the Firebase Console to prevent an
              orphaned authentication account.
            </strong>
            <br />
            <br />
            <strong>Are you absolutely sure you want to proceed?</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='mt-4'>
          <Button variant='outline' disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleHardDelete}
            disabled={isSubmitting}
            variant='destructive' // Tombol destructive untuk aksi berbahaya
            className='bg-red-600 hover:bg-red-700 text-white' // Pastikan styling jelas
          >
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isSubmitting ? 'Deleting...' : 'Yes, Permanently Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
