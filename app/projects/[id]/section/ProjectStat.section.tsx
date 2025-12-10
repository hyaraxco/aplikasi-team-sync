'use client'

import { Progress } from '@/components/molecules'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { ProjectMetrics } from '@/types'
import { differenceInDays } from 'date-fns'

interface ProjectStatsCardProps {
  metrics: ProjectMetrics | null
  activeMembersCount: number
  totalMembersCount: number
  completedProjectsCount: number
  totalProjectsCount: number
  averageProjectProgress: number // 0-100
  deadline?: Date
  startDate?: Date
  milestones?: { progress?: number }[]
}

export function ProjectStatsCard({
  metrics,
  activeMembersCount,
  totalMembersCount,
  completedProjectsCount,
  totalProjectsCount,
  averageProjectProgress,
  deadline,
  startDate,
  milestones = [],
}: ProjectStatsCardProps) {
  const activeMembersPercentage =
    totalMembersCount > 0 ? (activeMembersCount / totalMembersCount) * 100 : 0
  const projectCompletionPercentage =
    totalProjectsCount > 0 ? (completedProjectsCount / totalProjectsCount) * 100 : 0
  const daysToDeadline = deadline ? differenceInDays(deadline, new Date()) : null
  const milestoneProgress =
    milestones.length > 0
      ? milestones.reduce((sum, m) => sum + (m.progress ?? 0), 0) / milestones.length
      : 0

  // Deadline progress bar calculation
  let deadlineProgress = 0
  if (startDate && deadline) {
    const totalDays = differenceInDays(deadline, startDate)
    const daysPassed = differenceInDays(new Date(), startDate)
    if (totalDays > 0) {
      deadlineProgress = Math.min((daysPassed / totalDays) * 100, 100)
    } else {
      deadlineProgress = daysPassed >= 0 ? 100 : 0
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Project Summary</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-muted-foreground'>Active Task</span>
            <span className='text-sm font-medium'>
              {metrics?.completedTasks ?? 0}/{metrics?.totalTasks ?? 0}
            </span>
          </div>
          <Progress
            value={
              metrics && metrics.totalTasks > 0
                ? (metrics.completedTasks / metrics.totalTasks) * 100
                : 0
            }
            aria-label={`${metrics && metrics.totalTasks > 0 ? ((metrics.completedTasks / metrics.totalTasks) * 100).toFixed(0) : 0}% task completed`}
          />
        </div>
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-muted-foreground'>Project Progress</span>
            <span className='text-sm font-medium'>{averageProjectProgress.toFixed(0)}%</span>
          </div>
          <Progress
            value={averageProjectProgress}
            aria-label={`${averageProjectProgress.toFixed(0)}% project progress`}
            className='[&>div]:bg-green-500'
          />
        </div>
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-muted-foreground'>Active Members</span>
            <span className='text-sm font-medium'>
              {activeMembersCount}/{totalMembersCount}
            </span>
          </div>
          <Progress
            value={totalMembersCount > 0 ? (activeMembersCount / totalMembersCount) * 100 : 0}
            aria-label={`${totalMembersCount > 0 ? ((activeMembersCount / totalMembersCount) * 100).toFixed(0) : 0}% active members`}
          />
        </div>
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-muted-foreground'>Deadline</span>
            <span className='text-sm font-medium'>
              {daysToDeadline !== null ? `${daysToDeadline} days left` : '-'}
            </span>
          </div>
          <Progress
            value={deadlineProgress}
            aria-label={`${deadlineProgress.toFixed(0)}% time left to deadline`}
            className='[&>div]:bg-orange-500'
          />
        </div>
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-muted-foreground'>Milestone Progress</span>
            <span className='text-sm font-medium'>{milestoneProgress.toFixed(0)}%</span>
          </div>
          <Progress
            value={milestoneProgress}
            aria-label={`${milestoneProgress.toFixed(0)}% milestone progress`}
            className='[&>div]:bg-blue-500'
          />
        </div>
      </CardContent>
    </Card>
  )
}
