'use client'

import { Badge } from '@/components/atomics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { EmptyState } from '@/components/molecules/data-display/EmptyState'
import { addDays, differenceInCalendarDays, format, isBefore } from 'date-fns'
import { Clock, Flag } from 'lucide-react'

interface UpcomingDeadlineProps {
  tasks?: Array<{ id: string; title: string; dueDate: Date; status: string }>
  milestones?: Array<{
    id: string
    title: string
    dueDate: Date
    status: string
  }>
}

export function UpcomingDeadline({ tasks = [], milestones = [] }: UpcomingDeadlineProps) {
  // Gabungkan tasks & milestones, filter yang belum selesai dan dueDate <= 7 hari ke depan atau overdue
  const now = new Date()
  const tresholdDate = addDays(now, 7)
  const upcoming = [
    ...tasks.map(t => ({ ...t, type: 'Task' })),
    ...milestones.map(m => ({ ...m, type: 'Milestone' })),
  ]
    .filter(item => item.status.toLowerCase() !== 'completed')
    .filter(item => isBefore(item.dueDate, tresholdDate) || isBefore(item.dueDate, now))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

  return (
    <Card className='mt-4'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Upcoming Deadlines</CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <EmptyState
            title='No upcoming deadlines'
            description='There are no tasks or milestones due soon.'
          />
        ) : (
          <ul className='flex flex-col gap-2'>
            {upcoming.map(item => {
              const isOverdue = isBefore(item.dueDate, now)
              const daysLeft = differenceInCalendarDays(item.dueDate, now)
              return (
                <li
                  key={item.id}
                  className='flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition'
                >
                  <div className='flex flex-col'>
                    <span className='font-medium text-base'>{item.title}</span>
                    <div className='flex items-center gap-2 mt-1'>
                      <Badge variant='outline' className='text-xs px-2 py-0.5'>
                        {item.type}
                      </Badge>
                      {isOverdue ? (
                        <Badge variant='destructive' className='text-xs px-2 py-0.5'>
                          Overdue
                        </Badge>
                      ) : daysLeft <= 2 ? (
                        <Badge className='text-xs px-2 py-0.5 bg-orange-500'>Due soon</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {item.type === 'Task' ? (
                      <Clock className='h-4 w-4 text-muted-foreground' />
                    ) : (
                      <Flag className='h-4 w-4 text-blue-500' />
                    )}
                    <span className='text-sm font-medium'>
                      {format(item.dueDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
