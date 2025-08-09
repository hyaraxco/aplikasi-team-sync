'use client'

import { Avatar, AvatarFallback, AvatarImage, ScrollArea } from '@/components/molecules'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { EmptyState } from '@/components/molecules/data-display/EmptyState'
import { getUserData, resolveActorNameFromUserData } from '@/lib/database'
import { formatActivityMessageWithUsers } from '@/lib/database/activity'
import type { Activity as BaseActivity, UserData } from '@/types'
import { ActivityActionType } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { Activity } from 'lucide-react'
import { useEffect, useState } from 'react'

// Extend Activity type to explicitly allow string actions for legacy support
interface Activity extends Omit<BaseActivity, 'action'> {
  action: ActivityActionType | string
}

interface ProjectRecentActivityCardProps {
  activities: Activity[]
  // Optional: Pass a map or function to get user details for avatars if not embedded in Activity
  usersDataMap?: Map<string, UserData>
}

export function ProjectRecentActivityCard({
  activities,
  usersDataMap,
}: ProjectRecentActivityCardProps) {
  const [internalUsersData, setInternalUsersData] = useState<Map<string, UserData>>(new Map())

  // Fetch user data for activities if not provided via props
  useEffect(() => {
    const fetchUserData = async () => {
      // Fetch user data internally
      const uniqueUserIds = [...new Set(activities.map(activity => activity.userId))]
      const userDataMap = new Map<string, UserData>()

      await Promise.all(
        uniqueUserIds.map(async userId => {
          try {
            const userData = await getUserData(userId)
            if (userData) {
              userDataMap.set(userId, userData)
            }
          } catch (error) {
            console.error(`Error fetching user data for ${userId}:`, error)
          }
        })
      )
      setInternalUsersData(userDataMap)
    }

    if (activities.length > 0) {
      fetchUserData()
    }
  }, [activities, usersDataMap])

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <EmptyState
            icon={<Activity className='w-10 h-10 text-muted-foreground' />}
            title='No recent activity'
            description='No recent activity in this project yet.'
          />
        ) : (
          <ScrollArea className='h-[250px]'>
            <ul className='space-y-4'>
              {activities.map(activity => {
                // Use internal user data or fallback to prop-provided data
                const user =
                  internalUsersData.get(activity.userId) || usersDataMap?.get(activity.userId)
                let targetUser: UserData | undefined = undefined
                const details = activity.details || {}
                if (
                  details.requestedBy &&
                  (internalUsersData.get(details.requestedBy) ||
                    usersDataMap?.get(details.requestedBy))
                ) {
                  targetUser =
                    internalUsersData.get(details.requestedBy) ||
                    usersDataMap?.get(details.requestedBy)
                } else if (
                  details.assignedTo &&
                  (internalUsersData.get(details.assignedTo) ||
                    usersDataMap?.get(details.assignedTo))
                ) {
                  targetUser =
                    internalUsersData.get(details.assignedTo) ||
                    usersDataMap?.get(details.assignedTo)
                } else if (
                  details.approvedBy &&
                  (internalUsersData.get(details.approvedBy) ||
                    usersDataMap?.get(details.approvedBy))
                ) {
                  targetUser =
                    internalUsersData.get(details.approvedBy) ||
                    usersDataMap?.get(details.approvedBy)
                } else if (
                  details.userId &&
                  (internalUsersData.get(details.userId) || usersDataMap?.get(details.userId))
                ) {
                  targetUser =
                    internalUsersData.get(details.userId) || usersDataMap?.get(details.userId)
                }
                if (
                  !targetUser &&
                  Array.isArray(details.assignedTo) &&
                  details.assignedTo.length > 0
                ) {
                  const firstAssignee = details.assignedTo[0]
                  targetUser =
                    internalUsersData.get(firstAssignee) || usersDataMap?.get(firstAssignee)
                }
                const userName = user
                  ? resolveActorNameFromUserData(user, {
                      includeRole: true,
                      showUserIdInFallback: true,
                    })
                  : 'Unknown User'
                const displayMessage = formatActivityMessageWithUsers(activity, user, targetUser, {
                  includeRole: true,
                })
                const userInitials = user?.displayName
                  ? user.displayName.substring(0, 2).toUpperCase()
                  : 'U'
                const activityTimestamp =
                  activity.timestamp &&
                  typeof activity.timestamp !== 'string' &&
                  'seconds' in activity.timestamp
                    ? new Date(activity.timestamp.seconds * 1000)
                    : new Date() // Fallback to now if timestamp is problematic
                return (
                  <li key={activity.id} className='flex items-start gap-3'>
                    <Avatar className='h-8 w-8 border'>
                      <AvatarImage src={user?.photoURL || undefined} alt={userName} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <p className='text-sm'>{displayMessage}</p>
                      <p className='text-xs text-muted-foreground'>
                        {formatDistanceToNow(activityTimestamp, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
