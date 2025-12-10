'use client'

import { useAuth } from '@/components/auth-provider'
import { getUserData, resolveActorNameFromUserData } from '@/lib/database'
import { getActivityDisplayMessage, getNotificationTypeStyle } from '@/lib/helpers'
import type { Activity, UserData } from '@/types'
import { Timestamp } from 'firebase/firestore' // Import Timestamp
import { useEffect, useState } from 'react'

// Helper function for relative time (bisa dipindah ke utils jika dipakai di banyak tempat)
function formatRelativeTime(firebaseTimestamp: Timestamp | any): string {
  if (
    !(firebaseTimestamp instanceof Timestamp) &&
    !(
      firebaseTimestamp &&
      typeof firebaseTimestamp.seconds === 'number' &&
      typeof firebaseTimestamp.nanoseconds === 'number'
    )
  ) {
    return '' // Not a valid Timestamp object yet
  }
  const date = new Date(firebaseTimestamp.seconds * 1000 + firebaseTimestamp.nanoseconds / 1000000)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 5) return 'just now'
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return 'yesterday'
  if (diffInDays < 7) return `${diffInDays}d ago`
  return date.toLocaleDateString()
}

interface NotificationItemProps {
  notification: Activity
  onNotificationRead?: (notificationId: string) => void
}

export default function NotificationItem({
  notification,
  onNotificationRead,
}: NotificationItemProps) {
  const { user } = useAuth()
  const [actorUserData, setActorUserData] = useState<UserData | null>(null)
  const isUnread = notification.status === 'unread'

  // Handle notification click to mark as read
  const handleNotificationClick = async () => {
    if (isUnread && notification.id) {
      try {
        // Import the function dynamically to avoid import issues
        const { markActivityAsRead } = await import('@/lib/database')
        await markActivityAsRead(notification.id)
        // Call the callback to update parent state
        onNotificationRead?.(notification.id)
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }
  }

  // Fetch user data for the actor
  useEffect(() => {
    const fetchActorData = async () => {
      if (notification.userId && notification.userId !== user?.uid) {
        try {
          const userData = await getUserData(notification.userId)
          setActorUserData(userData)
        } catch (error) {
          console.error('Error fetching actor user data:', error)
        }
      }
    }

    fetchActorData()
  }, [notification.userId, user?.uid])

  const { icon: IconComponent, dotColor, titlePrefix } = getNotificationTypeStyle(notification.type)

  // Menentukan Title
  let title = titlePrefix || 'Notification'
  // Contoh sederhana untuk action, bisa diperluas
  if (notification.action) {
    const actionText = notification.action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    title = actionText.includes(title) ? actionText : `${title}: ${actionText}`
  }

  // Resolve actor name with proper fallback hierarchy
  const actorName = (() => {
    // If it's the current user, show "You"
    if (notification.userId && user && notification.userId === user.uid) {
      return 'You'
    }

    // Use fetched user data if available
    if (actorUserData) {
      return resolveActorNameFromUserData(actorUserData, {
        includeRole: true,
        showUserIdInFallback: true,
      })
    }

    // Fallback to details if available, otherwise unknown user with ID
    return (
      notification.details?.actorName ||
      `Unknown User (ID: ${notification.userId?.substring(0, 8) || 'unknown'})`
    )
  })()

  const message = getActivityDisplayMessage(notification, actorName)
  const time = formatRelativeTime(notification.timestamp)

  return (
    <div
      className={
        'flex items-start gap-3 border-b p-4 last:border-b-0 transition-colors cursor-pointer hover:bg-muted/5 ' +
        (isUnread ? 'bg-muted/20 border-l-4 border-l-primary' : 'bg-background') // Better visual distinction for unread
      }
      onClick={handleNotificationClick}
    >
      <div className='relative flex-shrink-0 mt-1'>
        <div className='h-10 w-10 rounded-full bg-muted flex items-center justify-center'>
          <IconComponent className='h-5 w-5 text-muted-foreground' />
        </div>
        {isUnread && (
          <span
            className={`absolute -top-1 -right-1 block h-3 w-3 rounded-full ${dotColor} border-2 border-background`}
          />
        )}
      </div>
      <div className='flex-1'>
        <div className='flex items-center justify-between'>
          <h4
            className={`text-sm ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/70'}`}
          >
            {title}
          </h4>
          {time && <span className='text-xs text-muted-foreground ml-2 flex-shrink-0'>{time}</span>}
        </div>
        <p
          className={`mt-0.5 text-sm ${isUnread ? 'text-muted-foreground font-medium' : 'text-muted-foreground/60'}`}
        >
          {message}
        </p>
      </div>
    </div>
  )
}
