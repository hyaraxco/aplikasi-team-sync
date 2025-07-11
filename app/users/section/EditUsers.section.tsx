'use client'

import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import { useAuth } from '@/components/auth-provider'
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
import {
  ActivityActionType,
  addActivity,
  updateUserData,
  type UserData,
  type UserRole,
} from '@/lib/firestore'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface EditUserDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  userToEdit: UserData | null
  onUserUpdated: () => void
}

export default function EditUserDialog({
  isOpen,
  onOpenChange,
  userToEdit,
  onUserUpdated,
}: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user: adminUser } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('employee')
  const [status, setStatus] = useState<UserData['status']>('active')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [baseSalary, setBaseSalary] = useState<number | string>('')

  useEffect(() => {
    if (userToEdit && isOpen) {
      // Populate form only if dialog is open and userToEdit exists
      setDisplayName(userToEdit.displayName || '')
      setEmail(userToEdit.email || '')
      setRole(userToEdit.role || 'employee')
      setStatus(userToEdit.status || 'active')
      setDepartment(userToEdit.department || '')
      setPosition(userToEdit.position || '')
      setPhoneNumber(userToEdit.phoneNumber || '')
      setBaseSalary(userToEdit.baseSalary === undefined ? '' : userToEdit.baseSalary)
    } else if (!isOpen) {
      // Reset form if dialog is closed
      resetForm()
    }
  }, [userToEdit, isOpen])

  const resetForm = () => {
    setDisplayName('')
    setEmail('')
    setRole('employee')
    setStatus('active')
    setDepartment('')
    setPosition('')
    setPhoneNumber('')
    setBaseSalary('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!adminUser) {
      toast.error('Admin not authenticated. Please re-login.')
      return
    }
    if (!userToEdit) {
      toast.error('No user selected for editing.')
      return
    }
    if (!displayName.trim() || !role || !status) {
      toast.error('Please fill in all required fields: Display Name, Role, and Status.')
      return
    }

    setIsSubmitting(true)
    try {
      const updatedUserPartialData: Partial<
        Omit<UserData, 'id' | 'createdAt' | 'email' | 'photoURL'>
      > = {
        displayName: displayName.trim(),
        role,
        status,
        baseSalary:
          typeof baseSalary === 'number' ? baseSalary : parseFloat(baseSalary as string) || 0,
        // Only include optional fields if they have values
        ...(department.trim() && { department: department.trim() }),
        ...(position.trim() && { position: position.trim() }),
        ...(phoneNumber.trim() && { phoneNumber: phoneNumber.trim() }),
      }

      await updateUserData(userToEdit.id, updatedUserPartialData)

      await addActivity({
        userId: adminUser.uid,
        type: 'user',
        action: ActivityActionType.USER_PROFILE_UPDATED,
        targetId: userToEdit.id,
        targetName: displayName.trim(),
        status: 'unread',
        details: {
          message: `${adminUser.displayName || adminUser.email} updated profile for ${displayName.trim()}.`,
          adminActor: adminUser.displayName || adminUser.email,
          updatedUserName: displayName.trim(),
        },
      })

      toast.success(`User ${displayName.trim()} updated successfully!`)
      onUserUpdated()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast.error(error.message || 'Failed to update user.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    // Do not render the dialog if it's not open
    return null
  }
  if (!userToEdit && isOpen) {
    // If open but no user (should ideally not happen if logic in parent is correct)
    onOpenChange(false) // Close it
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[525px]'>
        <DialogHeader>
          <DialogTitle>Edit User: {userToEdit?.displayName || userToEdit?.email}</DialogTitle>
          <DialogDescription>
            Update user details. Email and User ID cannot be changed here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-uid' className='text-right'>
                User ID
              </Label>
              <Input id='edit-uid' value={userToEdit?.id || ''} className='col-span-3' disabled />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-email' className='text-right'>
                Email
              </Label>
              <Input id='edit-email' type='email' value={email} className='col-span-3' disabled />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-displayName' className='text-right'>
                Full Name *
              </Label>
              <Input
                id='edit-displayName'
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDisplayName(e.target.value)
                }
                className='col-span-3'
                placeholder='John Doe'
                required
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-role' className='text-right'>
                Role *
              </Label>
              <Select
                value={role}
                onValueChange={(value: string) => setRole(value as UserRole)}
                required
              >
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder='Select a role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='employee'>Employee</SelectItem>
                  <SelectItem value='admin'>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-status' className='text-right'>
                Status *
              </Label>
              <Select
                value={status}
                onValueChange={(value: string) => setStatus(value as UserData['status'])}
                required
              >
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-department' className='text-right'>
                Department
              </Label>
              <Input
                id='edit-department'
                value={department}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepartment(e.target.value)}
                className='col-span-3'
                placeholder='e.g., Engineering'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-position' className='text-right'>
                Position
              </Label>
              <Input
                id='edit-position'
                value={position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPosition(e.target.value)}
                className='col-span-3'
                placeholder='e.g., Software Developer'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-phoneNumber' className='text-right'>
                Phone Number
              </Label>
              <Input
                id='edit-phoneNumber'
                type='tel'
                value={phoneNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPhoneNumber(e.target.value)
                }
                className='col-span-3'
                placeholder='+1234567890'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='edit-baseSalary' className='text-right'>
                Base Salary
              </Label>
              <Input
                id='edit-baseSalary'
                type='number'
                value={baseSalary}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBaseSalary(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className='col-span-3'
                placeholder='e.g., 50000'
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
