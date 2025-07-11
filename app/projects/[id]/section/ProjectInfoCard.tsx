'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/molecules/card'

import BadgePriority from '@/components/atomics/BadgePriority.atomic'
import BadgeStatus from '@/components/atomics/BadgeStatus.atomic'
import { ProjectPriority, ProjectStatus } from '@/lib/firestore'
import { format } from 'date-fns'
import { Clock } from 'lucide-react'

export interface TeamLeadInfo {
  name: string
  role: string
  avatarUrl?: string
}

interface ProjectInfoCardProps {
  description?: string
  statusInfo?: ProjectStatus
  priorityInfo?: ProjectPriority
  startDateInfo?: Date | string
  deadlineInfo?: Date | string
  clientInfo?: string
  budgetInfo?: number
  projectManagerInfo?: TeamLeadInfo
}

export function ProjectInfoCard({
  description,
  statusInfo,
  priorityInfo,
  startDateInfo,
  deadlineInfo,
  clientInfo,
  budgetInfo,
  projectManagerInfo,
}: ProjectInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Project Overview</CardTitle>
        <CardDescription>{description || 'No description provided.'}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='space-y-1'>
            <h3 className='text-sm font-medium text-muted-foreground'>Client</h3>
            <p>{clientInfo || '-'}</p>
          </div>
          <div className='space-y-1'>
            <h3 className='text-sm font-medium text-muted-foreground'>Budget</h3>
            <p>{typeof budgetInfo === 'number' ? `Rp${budgetInfo.toLocaleString()}` : '-'}</p>
          </div>
          <div className='space-y-1'>
            <h3 className='text-sm font-medium text-muted-foreground'>Project Manager</h3>
            <div className='flex items-center gap-2'>
              <span>{projectManagerInfo?.name || '-'}</span>
            </div>
          </div>
          <div className='space-y-1'>
            <h3 className='text-sm font-medium text-muted-foreground'>Status</h3>
            <div>{statusInfo ? <BadgeStatus status={statusInfo} /> : '-'}</div>
          </div>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='space-y-1'>
            <h3 className='text-sm font-medium text-muted-foreground'>Priority</h3>
            <div>{priorityInfo ? <BadgePriority priority={priorityInfo} /> : '-'}</div>
          </div>
          <div className='space-y-1'>
            <h3 className='text-sm font-medium text-muted-foreground'>Start Date</h3>
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <span>{startDateInfo ? format(new Date(startDateInfo), 'MMM d, yyyy') : '-'}</span>
            </div>
          </div>
          <div className='space-y-1'>
            <h3 className='text-sm font-medium text-muted-foreground'>Deadline</h3>
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <span>{deadlineInfo ? format(new Date(deadlineInfo), 'MMM d, yyyy') : '-'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
