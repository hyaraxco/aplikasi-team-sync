'use client'

import { Progress } from '@/components/molecules'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import type { TeamMetrics } from '@/lib/firestore'

interface TeamStatsCardProps {
  metrics: TeamMetrics | null
  activeMembersCount: number
  totalMembersCount: number
  completedProjectsCount: number
  totalProjectsCount: number
  averageProjectProgress: number // 0-100
}

export function TeamStatsCard({
  metrics,
  activeMembersCount,
  totalMembersCount,
  completedProjectsCount,
  totalProjectsCount,
  averageProjectProgress,
}: TeamStatsCardProps) {
  const activeMembersPercentage =
    totalMembersCount > 0 ? (activeMembersCount / totalMembersCount) * 100 : 0
  const projectCompletionPercentage =
    totalProjectsCount > 0 ? (completedProjectsCount / totalProjectsCount) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Team Stats</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-muted-foreground'>Active Members</span>
            <span className='text-sm font-medium'>
              {activeMembersCount}/{totalMembersCount}
            </span>
          </div>
          <Progress
            value={activeMembersPercentage}
            aria-label={`${activeMembersPercentage.toFixed(0)}% active members`}
          />
        </div>
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-muted-foreground'>Project Completion</span>
            <span className='text-sm font-medium'>
              {completedProjectsCount}/{totalProjectsCount}
            </span>
          </div>
          <Progress
            value={projectCompletionPercentage}
            aria-label={`${projectCompletionPercentage.toFixed(0)}% project completion`}
            className='[&>div]:bg-green-500'
          />
        </div>
        <div>
          <div className='flex justify-between mb-1'>
            <span className='text-sm text-muted-foreground'>Average Progress</span>
            <span className='text-sm font-medium'>{averageProjectProgress.toFixed(0)}%</span>
          </div>
          <Progress
            value={averageProjectProgress}
            aria-label={`${averageProjectProgress.toFixed(0)}% average progress`}
          />
        </div>
      </CardContent>
    </Card>
  )
}
