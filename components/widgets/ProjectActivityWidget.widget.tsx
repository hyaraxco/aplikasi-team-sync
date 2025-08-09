'use client'

import { Skeleton } from '@/components/atomics/skeleton'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { getProjects, getTasks } from '@/lib/database'
import type { Project, Task } from '@/types'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { Activity, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface ProjectActivityWidgetProps {
  className?: string
}

interface ActivityData {
  date: string
  tasks: number
  projects: number
}

/**
 * Project Activity widget showing recent activity trends
 * Replaces the Task Activity chart from reference design
 */
export function ProjectActivityWidget({ className = '' }: ProjectActivityWidgetProps) {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [totalActivity, setTotalActivity] = useState(0)

  const fetchActivityData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Get data for the last 7 days
      const [projectsData, tasksData] = await Promise.all([
        getProjects(userRole === 'admin' ? undefined : user.uid, userRole),
        getTasks(userRole === 'admin' ? undefined : user.uid, userRole)
      ])

      // Generate activity data for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i)
        const dayStart = startOfDay(date)
        const dayEnd = endOfDay(date)

        // Count tasks created/updated on this day
        const dayTasks = tasksData.filter(task => {
          const taskDate = task.createdAt?.toDate() || new Date()
          return taskDate >= dayStart && taskDate <= dayEnd
        }).length

        // Count projects created/updated on this day
        const dayProjects = projectsData.filter(project => {
          const projectDate = project.createdAt?.toDate() || new Date()
          return projectDate >= dayStart && projectDate <= dayEnd
        }).length

        return {
          date: format(date, 'MMM dd'),
          tasks: dayTasks,
          projects: dayProjects
        }
      })

      setActivityData(last7Days)
      setTotalActivity(tasksData.length + projectsData.length)
    } catch (error) {
      console.error('Error fetching activity data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, userRole])

  useEffect(() => {
    fetchActivityData()
  }, [fetchActivityData])

  const maxValue = Math.max(...activityData.map(d => d.tasks + d.projects), 1)

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Activity className='h-5 w-5' />
          Project Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='space-y-4'>
            <Skeleton className='h-6 w-24' />
            <div className='flex items-end gap-2 h-32'>
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className='flex-1 h-full' />
              ))}
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Activity Summary */}
            <div className='flex items-center gap-2'>
              <TrendingUp className='h-4 w-4 text-green-500' />
              <span className='text-sm text-muted-foreground'>
                {totalActivity} total activities this week
              </span>
            </div>

            {/* Simple Bar Chart */}
            <div className='flex items-end gap-2 h-32'>
              {activityData.map((day, index) => {
                const totalHeight = day.tasks + day.projects
                const heightPercentage = (totalHeight / maxValue) * 100
                
                return (
                  <div key={index} className='flex-1 flex flex-col items-center gap-1'>
                    <div className='w-full flex flex-col justify-end h-24'>
                      {/* Projects bar (bottom) */}
                      {day.projects > 0 && (
                        <div 
                          className='w-full bg-blue-500 rounded-t-sm'
                          style={{ 
                            height: `${(day.projects / maxValue) * 100}%`,
                            minHeight: day.projects > 0 ? '4px' : '0px'
                          }}
                        />
                      )}
                      {/* Tasks bar (top) */}
                      {day.tasks > 0 && (
                        <div 
                          className='w-full bg-green-500 rounded-t-sm'
                          style={{ 
                            height: `${(day.tasks / maxValue) * 100}%`,
                            minHeight: day.tasks > 0 ? '4px' : '0px'
                          }}
                        />
                      )}
                    </div>
                    <span className='text-xs text-muted-foreground'>{day.date}</span>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className='flex items-center gap-4 text-xs'>
              <div className='flex items-center gap-1'>
                <div className='w-3 h-3 bg-green-500 rounded-sm' />
                <span>Tasks</span>
              </div>
              <div className='flex items-center gap-1'>
                <div className='w-3 h-3 bg-blue-500 rounded-sm' />
                <span>Projects</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
