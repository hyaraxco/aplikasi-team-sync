'use client'

import BadgePriority from '@/components/atomics/BadgePriority.atomic'
import BadgeStatus from '@/components/atomics/BadgeStatus.atomic'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  Progress,
} from '@/components/molecules'
import type { Project, Team } from '@/types'
import { format } from 'date-fns'
import { Clock } from 'lucide-react'

interface ProjectCardProps {
  project: Project & {
    assignedTeams?: (Team & { memberDetails?: any[] })[]
    metrics?: {
      totalTasks: number
      completedTasks: number
      completionRate: number
      milestoneProgress?: number
    }
  }
  onClick?: () => void
}

const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const deadlineDate = project.deadline ? project.deadline.toDate() : undefined
  const taskProgress = project.metrics?.completionRate || 0
  const milestoneProgress = project.metrics?.milestoneProgress || 0

  // Calculate overall progress (weighted average of task and milestone progress)
  const progress =
    project.milestones && project.milestones.length > 0
      ? taskProgress * 0.7 + milestoneProgress * 0.3 // 70% task progress, 30% milestone progress
      : taskProgress // If no milestones, use task progress only

  const completedTasks = project.metrics?.completedTasks || 0
  const totalTasks = project.metrics?.totalTasks || 0

  // Safely get assigned teams and handle fallbacks
  const assignedTeams = project.assignedTeams || []
  const totalTeamCount = project.teams?.length || 0

  return (
    <Card
      className='overflow-hidden cursor-pointer transition-all hover:shadow-md flex flex-col h-full'
      onClick={onClick}
    >
      <CardContent className='p-4 space-y-3 flex flex-col flex-grow'>
        <div className='flex-grow space-y-3'>
          <div>
            <div className='flex justify-between items-center mb-1'>
              <h3 className='font-semibold text-lg leading-tight truncate'>{project.name}</h3>
              <BadgePriority priority={project.priority} />
            </div>
            <p className='text-sm text-muted-foreground line-clamp-2 h-[40px]'>
              {project.description}
            </p>
          </div>

          <div className='flex justify-between items-center text-sm'>
            <div className='flex items-center'>
              <Clock className='mr-1.5 h-4 w-4 text-muted-foreground' />
              <span className='text-xs text-muted-foreground'>Due: </span>
              <span className='text-xs ml-1 font-medium'>
                {deadlineDate ? format(deadlineDate, 'MMM d, yyyy') : 'N/A'}
              </span>
            </div>
            <BadgeStatus status={project.status} />
          </div>

          {/* Progress bar */}
          <div className='space-y-1'>
            <div className='flex justify-between text-sm text-muted-foreground'>
              <span>Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress
              value={progress}
              className='h-2 w-full'
              aria-label={`${project.name} progress`}
            />
          </div>

          <div className='flex justify-between items-center text-sm'>
            <div>
              <span className='text-muted-foreground'>Tasks: </span>
              <span>
                {completedTasks}/{totalTasks}
                {totalTasks === 0 && (
                  <span className='text-xs text-muted-foreground ml-1'>(No tasks yet)</span>
                )}
              </span>
            </div>
            <div className='flex -space-x-2'>
              {assignedTeams.slice(0, 3).map((team: Team & { memberDetails?: any[] }) => {
                // Try to get a member photo, fallback to team initial
                const memberPhoto = team.memberDetails?.[0]?.photoURL
                const teamInitial = team.name?.charAt(0).toUpperCase() || 'T'

                return (
                  <Avatar key={team.id} className='h-6 w-6 border-2 border-background'>
                    <AvatarImage src={memberPhoto || undefined} alt={`${team.name} team`} />
                    <AvatarFallback className='text-[10px]'>{teamInitial}</AvatarFallback>
                  </Avatar>
                )
              })}
              {totalTeamCount > 3 && (
                <div className='flex items-center justify-center h-6 w-6 rounded-full bg-muted text-[10px] font-medium border-2 border-background'>
                  +{totalTeamCount - 3}
                </div>
              )}
              {totalTeamCount === 0 && (
                <span className='text-xs text-muted-foreground'>No teams assigned</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProjectCard
