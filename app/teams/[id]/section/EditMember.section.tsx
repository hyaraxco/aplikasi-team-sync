'use client'

import { Button, Input } from '@/components/atomics'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/molecules/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/molecules/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/molecules/select'

import { useAuth } from '@/components/auth-provider'
import {
  ActivityActionType,
  addActivity,
  getUserData,
  setTeamLeader,
  updateTeamMemberDetails,
  type TeamMember,
} from '@/lib/database'
import { zodResolver } from '@hookform/resolvers/zod'
import { serverTimestamp } from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const memberStatusOptions = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'on-leave', label: 'On Leave' },
]

const editMemberFormSchema = z.object({
  role: z.string().min(1, {
    message: 'Please select a role',
  }),
  status: z.string().min(1, {
    message: 'Please select a status',
  }),
})

type EditMemberFormData = z.infer<typeof editMemberFormSchema>

interface EditMemberDialogProps {
  teamId: string
  memberData?: TeamMemberWithData
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onMemberUpdated: () => void
  teamLeadId?: string // userId leader saat ini
  onFullTeamRefresh?: () => void
}

interface TeamMemberWithData extends TeamMember {
  userData?: {
    displayName?: string
    email?: string
  }
}

export function EditMemberDialog({
  teamId,
  memberData,
  isOpen,
  onOpenChange,
  onMemberUpdated,
  teamLeadId,
  onFullTeamRefresh,
}: EditMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSettingLeader, setIsSettingLeader] = useState(false)
  const { user } = useAuth()

  const form = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberFormSchema),
    defaultValues: {
      role: memberData?.role || '',
      status: memberData?.status || 'active',
    },
  })

  const onSubmit = async (data: EditMemberFormData) => {
    if (!memberData) return
    setIsSubmitting(true)
    try {
      await updateTeamMemberDetails(teamId, memberData.userId, {
        role: data.role,
        status: data?.status || 'active',
      })
      if (user) {
        await addActivity({
          userId: user.uid,
          type: 'team',
          action: ActivityActionType.TEAM_MEMBER_DETAILS_UPDATED,
          targetId: teamId,
          targetName: teamId,
          timestamp: serverTimestamp(),
          teamId: teamId,
          details: {
            updatedUserId: memberData.userId,
            updatedUserName:
              memberData.userData?.displayName || memberData.userData?.email || memberData.userId,
            updatedUserRole: data.role,
            updatedUserStatus: data.status,
          },
        })
      }
      onMemberUpdated()
      onOpenChange(false)
    } catch (error) {
      // Error handling bisa ditambah jika ingin
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetAsLeader = async () => {
    if (!memberData) return
    setIsSettingLeader(true)
    try {
      const userData = await getUserData(memberData.userId)
      if (!userData) throw new Error('User data not found')
      await setTeamLeader(teamId, memberData, userData)
      if (user) {
        await addActivity({
          userId: user.uid,
          type: 'team',
          action: ActivityActionType.TEAM_LEAD_CHANGED,
          targetId: teamId,
          targetName: teamId,
          timestamp: serverTimestamp(),
          teamId: teamId,
          details: {
            newLeadUserId: memberData.userId,
            newLeadUserName:
              memberData.userData?.displayName || memberData.userData?.email || memberData.userId,
          },
        })
      }
      if (onFullTeamRefresh) {
        onFullTeamRefresh()
      } else {
        onMemberUpdated()
      }
      onOpenChange(false)
    } catch (err) {
      // Error handling bisa ditambah jika ingin
    }
    setIsSettingLeader(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update the details for{' '}
            {memberData?.userData?.displayName || memberData?.userData?.email}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g: Developer, Designer, etc.' {...field} />
                  </FormControl>
                  <FormDescription>
                    Specify the primary role or position of this member within the team.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a status' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {memberStatusOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the current working status of this team member within the organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 w-4 h-4 animate-spin' />
                    Updating
                  </>
                ) : (
                  'Update'
                )}
              </Button>
            </DialogFooter>
            {/* Set as Leader Button */}
            {teamLeadId !== memberData?.userId && (
              <Button
                type='button'
                variant='secondary'
                className='w-full mt-2'
                onClick={handleSetAsLeader}
                disabled={isSettingLeader}
              >
                {isSettingLeader ? (
                  <>
                    <Loader2 className='mr-2 w-4 h-4 animate-spin' />
                    Setting as Leader
                  </>
                ) : (
                  'Set as Leader'
                )}
              </Button>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
