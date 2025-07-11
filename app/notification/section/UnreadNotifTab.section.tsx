import { EmptyState } from '@/components/common/data-display/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell } from 'lucide-react'
import NotificationItem from './NotificationItem.section'

interface UnreadNotifTabProps {
  notifications: any[]
  loading: boolean
}

export default function UnreadNotifTab({ notifications, loading }: UnreadNotifTabProps) {
  if (loading) {
    return (
      <div className='space-y-4 p-4'>
        {[...Array(5)].map((_, i) => (
          <div key={i} className='flex items-start gap-3 border-b pb-4 last:border-b-0'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <div className='space-y-2 flex-1'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-5 w-1/3' />
                <Skeleton className='h-4 w-16' />
              </div>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell className='w-10 h-10 text-muted-foreground' />}
        title='No unread notifications'
        description="You're all caught up!"
      />
    )
  }
  return (
    <div>
      {notifications.map(notif => (
        <NotificationItem key={notif.id} notification={notif} />
      ))}
    </div>
  )
}
