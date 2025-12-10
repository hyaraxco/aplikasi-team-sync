'use client'

import { Skeleton } from '@/components/atomics/skeleton'
import { useAuth } from '@/components/auth-provider'
import { Avatar, AvatarFallback } from '@/components/molecules/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { EmptyState } from '@/components/molecules/data-display'
import { getRecentActivities, getUserActivities, getUserData } from '@/lib/database'
import { formatActivityMessageWithUsers } from '@/lib/database/activity'
import { formatDate } from '@/lib/ui'
import type { Activity, UserData } from '@/types'
import {
  Activity as ActivityIcon,
  CheckCircle2,
  Clock,
  DollarSign,
  LogIn,
  LogOut,
  Plus,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface RecentActivityWidgetProps {
  className?: string
}

/**
 * Recent Activity widget showing latest system activities
 * Matches the Recent Activity section from reference design
 */
export function RecentActivityWidget({ className = '' }: RecentActivityWidgetProps) {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [usersData, setUsersData] = useState<Record<string, UserData>>({})

  const fetchActivities = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch activities based on user role
      let activitiesData: Activity[]
      if (userRole === 'admin') {
        activitiesData = await getRecentActivities(8) // Show more for admin
      } else {
        activitiesData = await getUserActivities(user.uid, 6) // Show personal activities
      }

      setActivities(activitiesData)

      // Fetch user data for each activity
      const userIds = [...new Set(activitiesData.map(activity => activity.userId))]
      const userDataPromises = userIds.map(userId => getUserData(userId))
      const userDataResults = await Promise.all(userDataPromises)

      const usersMap: Record<string, UserData> = {}
      userDataResults.forEach(userData => {
        if (userData) {
          usersMap[userData.id] = userData
        }
      })
      setUsersData(usersMap)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }, [user, userRole])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const getActivityIcon = (type: string, action: string) => {
    switch (type) {
      case 'task':
        if (action.includes('CREATED')) return <Plus className='h-4 w-4 text-blue-500' />
        if (action.includes('COMPLETED')) return <CheckCircle2 className='h-4 w-4 text-green-500' />
        return <Clock className='h-4 w-4 text-yellow-500' />
      case 'attendance':
        if (action.includes('CHECK_IN')) return <LogIn className='h-4 w-4 text-blue-500' />
        if (action.includes('CHECK_OUT')) return <LogOut className='h-4 w-4 text-orange-500' />
        return <Clock className='h-4 w-4 text-gray-500' />
      case 'earning':
        return <DollarSign className='h-4 w-4 text-green-500' />
      case 'project':
        return <Plus className='h-4 w-4 text-purple-500' />
      default:
        return <ActivityIcon className='h-4 w-4 text-gray-500' />
    }
  }

  const getActivityDescription = (activity: Activity) => {
    const user = usersData[activity.userId]
    const userName = user?.displayName || 'Someone'

    switch (activity.type) {
      case 'task': {
        if (activity.action.includes('CREATED')) return `${userName} created a task.`
        if (activity.action.includes('COMPLETED')) return `${userName} completed a task.`
        if (activity.action.includes('UPDATED')) return `${userName} updated a task.`
        return `${userName} worked on a task.`
      }
      case 'attendance': {
        if (activity.action.includes('CHECK_IN')) return `${userName} checked in.`
        if (activity.action.includes('CHECK_OUT')) return `${userName} checked out.`
        return `${userName} updated their attendance.`
      }
      case 'earning': {
        const earningType = activity.details?.type ? activity.details.type : 'an activity'
        return `${userName} received earnings from ${earningType}.`
      }
      case 'project': {
        if (activity.action.includes('CREATED')) return `${userName} created a project.`
        return `${userName} updated a project.`
      }
      default:
        return `${userName} performed an action.`
    }
  }

  const getUserInitials = (userId: string) => {
    const user = usersData[userId]
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <ActivityIcon className='h-5 w-5' />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='space-y-3'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='flex items-center gap-3'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <div className='flex-1 space-y-1'>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={<ActivityIcon className='h-8 w-8 text-muted-foreground' />}
            title='No recent activity'
            description='No activities found for this period.'
          />
        ) : (
          <div className='space-y-3'>
            {activities.map(activity => {
              // Actor user
              const actorUser = usersData[activity.userId]
              // Try to resolve target user from details (commonly requestedBy, assignedTo, approvedBy, etc)
              let targetUser: UserData | undefined = undefined
              const details = activity.details || {}
              if (details.requestedBy && usersData[details.requestedBy]) {
                targetUser = usersData[details.requestedBy]
              } else if (details.assignedTo && usersData[details.assignedTo]) {
                targetUser = usersData[details.assignedTo]
              } else if (details.approvedBy && usersData[details.approvedBy]) {
                targetUser = usersData[details.approvedBy]
              } else if (details.userId && usersData[details.userId]) {
                targetUser = usersData[details.userId]
              }
              // Fallback: if assignedTo is an array, try first element
              if (
                !targetUser &&
                Array.isArray(details.assignedTo) &&
                details.assignedTo.length > 0
              ) {
                const firstAssignee = details.assignedTo[0]
                if (usersData[firstAssignee]) targetUser = usersData[firstAssignee]
              }
              // Render message
              const message = formatActivityMessageWithUsers(activity, actorUser, targetUser, {
                includeRole: true,
              })
              return (
                <div
                  key={activity.id}
                  className='flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors'
                >
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback className='text-xs'>
                      {getUserInitials(activity.userId)}
                    </AvatarFallback>
                  </Avatar>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      {getActivityIcon(activity.type, activity.action)}
                      <p className='text-sm font-medium truncate'>{message}</p>
                    </div>

                    <div className='flex items-center gap-2 mt-1'>
                      <p className='text-xs text-muted-foreground'>
                        {formatDate(
                          activity.timestamp &&
                            typeof activity.timestamp === 'object' &&
                            'toDate' in activity.timestamp
                            ? activity.timestamp
                            : null,
                          { fallback: 'Unknown Date' }
                        )}
                      </p>
                      {activity.targetName && (
                        <>
                          <span className='text-xs text-muted-foreground'>•</span>
                          <p className='text-xs text-muted-foreground truncate'>
                            {activity.targetName}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
