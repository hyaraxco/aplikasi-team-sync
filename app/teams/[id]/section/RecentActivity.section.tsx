'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/atomics/Avatar.atomic'
import { EmptyState } from '@/components/molecules/data-display/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getActivityDisplayMessage } from '@/lib/activity-formatter'
import { type Activity as BaseActivity, type UserData, ActivityActionType } from '@/lib/firestore'
import { formatDistanceToNow } from 'date-fns'
import { Activity } from 'lucide-react'

// Extend Activity type to explicitly allow string actions for legacy support
interface Activity extends Omit<BaseActivity, 'action'> {
  action: ActivityActionType | string
}

interface RecentActivityCardProps {
  activities: Activity[]
  // Optional: Pass a map or function to get user details for avatars if not embedded in Activity
  usersDataMap?: Map<string, UserData>
}

export function RecentActivityCard({ activities, usersDataMap }: RecentActivityCardProps) {
  if (!activities || activities.length === 0) {
    return (
      <EmptyState
        // icon={Activity}
        title='No recent activity'
        description='No recent activity in this team yet.'
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className='h-[250px]'>
          <ul className='space-y-4'>
            {activities.map(activity => {
              // Attempt to get user for avatar, fallback if not available
              const user = usersDataMap?.get(activity.userId)
              const userName = user?.displayName || user?.email || 'User'
              const userInitials = user?.displayName
                ? user.displayName.substring(0, 2).toUpperCase()
                : 'U'
              const activityTimestamp =
                activity.timestamp &&
                typeof activity.timestamp !== 'string' &&
                'seconds' in activity.timestamp
                  ? new Date(activity.timestamp.seconds * 1000)
                  : new Date() // Fallback to now if timestamp is problematic

              const displayMessage = getActivityDisplayMessage(activity, userName)

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
      </CardContent>
    </Card>
  )
}
