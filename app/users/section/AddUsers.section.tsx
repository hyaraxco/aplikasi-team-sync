'use client'

import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import { useAuth } from '@/components/auth-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/molecules'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/molecules/dialog'

import { auth, secondaryAuth } from '@/lib/firebase'
import {
  ActivityActionType,
  addActivity,
  createUserData,
  formatCurrencyInput,
  parseCurrencyInput,
  type UserData,
  type UserRole,
} from '@/lib/helpers'
import { createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface AddUserDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onUserAdded: () => void
}

export default function AddUserDialog({ isOpen, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user: adminUser } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('employee')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [baseSalary, setBaseSalary] = useState<number | ''>('')
  const [displayBaseSalary, setDisplayBaseSalary] = useState<string>('')
  const [newUserCreatedInfo, setNewUserCreatedInfo] = useState<{
    name: string
    email: string
  } | null>(null)

  const resetForm = () => {
    setDisplayName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setRole('employee')
    setDepartment('')
    setPosition('')
    setPhoneNumber('')
    setBaseSalary('')
    setDisplayBaseSalary('')
  }

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const handleBaseSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseCurrencyInput(e.target.value)
    if (rawValue === '' || /^[0-9]*$/.test(rawValue)) {
      setDisplayBaseSalary(formatCurrencyInput(rawValue))
      setBaseSalary(rawValue === '' ? '' : Number(rawValue))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!adminUser) {
      toast.error('Admin not authenticated. Please re-login.')
      return
    }
    if (!displayName.trim() || !email.trim() || !role || !password) {
      toast.error('Please fill in all required fields: Display Name, Email, Password, and Role.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }

    setIsSubmitting(true)
    let newUserId = ''

    try {
      if (secondaryAuth) {
        try {
          // Create user with secondary auth (won't affect current admin session)
          const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth,
            email.trim(),
            password
          )
          newUserId = userCredential.user.uid

          if (userCredential.user) {
            await updateProfile(userCredential.user, {
              displayName: displayName.trim(),
            })
          }

          // Sign out from secondary auth immediately
          await signOut(secondaryAuth)
        } catch (secondaryAuthError) {
          console.warn('Secondary auth failed, falling back to main auth:', secondaryAuthError)
          // Set flag to indicate fallback to main auth
          localStorage.setItem('tempFallbackToMainAuth', 'true')

          // Fallback to main auth method
          const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
          newUserId = userCredential.user.uid

          if (userCredential.user) {
            await updateProfile(userCredential.user, {
              displayName: displayName.trim(),
            })
          }

          // Sign out the newly created user
          await signOut(auth)
        }
      } else {
        // Fallback: Use main auth but handle session restoration
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
        newUserId = userCredential.user.uid

        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: displayName.trim(),
          })
        }

        // Sign out the newly created user
        await signOut(auth)
      }

      const newUserPartialData: Partial<UserData> = {
        displayName: displayName.trim(),
        email: email.trim(),
        role,
        status: 'active',
        baseSalary: baseSalary === '' ? 0 : baseSalary,
        // Only include optional fields if they have values
        ...(department.trim() && { department: department.trim() }),
        ...(position.trim() && { position: position.trim() }),
        ...(phoneNumber.trim() && { phoneNumber: phoneNumber.trim() }),
      }

      await createUserData(newUserId, newUserPartialData)

      // Determine if we successfully used secondary auth or fell back to main auth
      const usedSecondaryAuth = secondaryAuth && !localStorage.getItem('tempFallbackToMainAuth')

      // Clean up temporary flag
      localStorage.removeItem('tempFallbackToMainAuth')

      if (usedSecondaryAuth) {
        // Secondary auth was successful - admin session is preserved
        await addActivity({
          userId: adminUser.uid,
          type: 'user',
          action: ActivityActionType.USER_CREATED,
          targetId: newUserId,
          targetName: displayName.trim(),
          status: 'unread',
          details: {
            message: `${adminUser.displayName || adminUser.email} added ${displayName.trim()} as a new ${role}.`,
            adminActor: adminUser.displayName || adminUser.email,
            newUserName: displayName.trim(),
            newUserRole: role,
          },
        })

        toast.success(`User ${displayName.trim()} created successfully!`)
        resetForm()
        onOpenChange(false)
        onUserAdded()
      } else {
        // Main auth was used - need to handle session restoration
        localStorage.setItem(
          'pendingUserCreation',
          JSON.stringify({
            adminEmail: adminUser.email,
            adminDisplayName: adminUser.displayName,
            newUserId,
            newUserName: displayName.trim(),
            newUserRole: role,
          })
        )

        toast.success(`User ${displayName.trim()} created successfully!`)
        setNewUserCreatedInfo({
          name: displayName.trim(),
          email: email.trim(),
        })
        resetForm()
      }
    } catch (error: any) {
      console.error('Error adding user:', error)
      toast.error(error.message || 'Failed to add user.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAdminReturnToLogin = async () => {
    setNewUserCreatedInfo(null)
    onOpenChange(false)
    onUserAdded()
    // The admin will need to log in again, and we'll handle the pending activity in AuthProvider
  }

  if (newUserCreatedInfo) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={openState => {
          if (!openState) {
            handleAdminReturnToLogin()
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>User Created: {newUserCreatedInfo.name}</DialogTitle>
            <DialogDescription className='py-2'>
              User <span className='font-semibold'>{newUserCreatedInfo.name}</span> (
              {newUserCreatedInfo.email}) has been successfully created.
              <br />
              <br />
              For security reasons, you have been logged out. Please log back in with your admin
              credentials to continue managing users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-4'>
            <Button onClick={handleAdminReturnToLogin} className='w-full'>
              Continue to Login Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(openState: boolean) => {
        onOpenChange(openState)
      }}
    >
      <DialogContent className='sm:max-w-[525px]'>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Manually add a new user to the system. This will create both an authentication account
            and a user record.
          </DialogDescription>
        </DialogHeader>
        <form id='addUserForm' onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='displayName' className='text-right'>
                Full Name *
              </Label>
              <Input
                id='displayName'
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
              <Label htmlFor='email' className='text-right'>
                Email *
              </Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className='col-span-3'
                placeholder='john.doe@example.com'
                required
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='role' className='text-right'>
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
              <Label htmlFor='department' className='text-right'>
                Department
              </Label>
              <Input
                id='department'
                value={department}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepartment(e.target.value)}
                className='col-span-3'
                placeholder='e.g., Engineering'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='position' className='text-right'>
                Position
              </Label>
              <Input
                id='position'
                value={position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPosition(e.target.value)}
                className='col-span-3'
                placeholder='e.g., Software Developer'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='phoneNumber' className='text-right'>
                Phone Number
              </Label>
              <Input
                id='phoneNumber'
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
              <Label htmlFor='baseSalary' className='text-right'>
                Base Salary
              </Label>
              <Input
                id='baseSalary'
                type='text'
                value={displayBaseSalary}
                onChange={handleBaseSalaryChange}
                className='col-span-3'
                placeholder='e.g., 50.000'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='passwordInput' className='text-right'>
                Password *
              </Label>
              <Input
                id='passwordInput'
                type='password'
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className='col-span-3'
                placeholder='Min. 6 characters'
                required
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='confirmPasswordInput' className='text-right'>
                Confirm Password *
              </Label>
              <Input
                id='confirmPasswordInput'
                type='password'
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                className='col-span-3'
                placeholder='Retype password'
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' form='addUserForm' disabled={isSubmitting}>
              {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isSubmitting ? 'Adding...' : 'Add User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
