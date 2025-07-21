'use client'

import { Button } from '@/components/atomics/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/molecules'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/molecules/card'
import { Briefcase, ListChecks, UserPen, Users } from 'lucide-react' // Example icons

export interface TeamLeadInfo {
  name: string
  role: string
  avatarUrl?: string
}

interface TeamInfoCardProps {
  description?: string
  totalMembers: number
  totalProjects: number
  totalTasks: number
  lead?: TeamLeadInfo
  onChangeLeader?: () => void
  isAdmin?: boolean
}

export function TeamInfoCard({
  description,
  totalMembers,
  totalProjects,
  totalTasks,
  lead,
  onChangeLeader,
  isAdmin = false,
}: TeamInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Team Overview</CardTitle>
        <CardDescription>{description || 'No description provided.'}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {/* Total Members */}
          <div className='flex flex-col items-center rounded-lg border p-4 sm:items-start'>
            <div className='flex items-center text-muted-foreground'>
              <Users className='h-4 w-4 mr-2 flex-shrink-0' />
              <span className='text-xs font-medium'>Total Members</span>
            </div>
            <p className='text-2xl font-bold text-primary'>{totalMembers}</p>
          </div>

          {/* Total Projects */}
          <div className='flex flex-col items-center rounded-lg border p-4 sm:items-start'>
            <div className='flex items-center text-muted-foreground mb-1'>
              <Briefcase className='h-4 w-4 mr-2 flex-shrink-0' />
              <span className='text-xs font-medium'>Total Projects</span>
            </div>
            <p className='text-2xl font-bold text-primary'>{totalProjects}</p>
          </div>

          {/* Total Tasks */}
          <div className='flex flex-col items-center rounded-lg border p-4 sm:items-start'>
            <div className='flex items-center text-muted-foreground mb-1'>
              <ListChecks className='h-4 w-4 mr-2 flex-shrink-0' />
              <span className='text-xs font-medium'>Total Tasks</span>
            </div>
            <p className='text-2xl font-bold text-primary'>{totalTasks}</p>
          </div>
        </div>
        {lead && (
          <div className='pt-2'>
            <h4 className='text-sm font-medium mb-2 text-muted-foreground'>Team Lead</h4>
            <div className='flex items-center gap-3 rounded-lg bg-muted/30'>
              <Avatar className='h-10 w-10'>
                <AvatarImage src={lead?.avatarUrl} alt={lead.name} />
                <AvatarFallback>{lead.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className='font-semibold text-sm'>{lead.name}</p>
                <p className='text-xs text-muted-foreground'>{lead.role}</p>
              </div>
              {isAdmin && (
                <Button
                  type='button'
                  size='sm'
                  className='ml-2'
                  onClick={onChangeLeader}
                  variant='secondary'
                >
                  <UserPen className='w-4 h-4 mr-1' /> Edit
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
