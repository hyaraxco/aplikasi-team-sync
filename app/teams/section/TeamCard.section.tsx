'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/atomics/Avatar.atomic'
import { Progress } from '@/components/atomics/progress'
import { Card } from '@/components/molecules/card'
import { Team } from '@/lib/firestore'
import { Users } from 'lucide-react'

interface TeamProps {
  team: Team
  onClick?: () => void
}

const TeamCard = ({ team, onClick }: TeamProps) => {
  return (
    <Card
      className='overflow-hidden transition-all hover:shadow-md cursor-pointer'
      onClick={onClick}
    >
      <div className='p-6'>
        <div className='flex flex-col gap-4'>
          {/* header */}
          <div className='flex flex-col gap-2 mb-6'>
            <div className='flex items-center justify-between'>
              <h3 className='font-bold text-xl'>{team.name}</h3>
              <div className='flex items-center text-sm text-muted-foreground'>
                <Users className='h-4 w-4 mr-1' />
                <span>{team.members.length}</span>
              </div>
            </div>
            <h4 className='text-sm text-muted-foreground line-clamp-2'>{team.description}</h4>
          </div>

          {/* Projects count */}
          <div className='flex justify-between text-sm'>
            <div>
              <span className='font-medium'>Projects: </span>
              <span>{team.metrics?.activeProjects}</span>
            </div>
            <div>
              <span className='font-medium'>Tasks: </span>
              <span>
                {team.metrics?.completedTasks || 0}/{team.metrics?.totalTasks || 0}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className='space-y-1'>
            <div className='flex justify-between text-sm text-muted-foreground'>
              <span>Progress</span>
              <span> {(team.metrics?.completionRate || 0).toFixed(0)}%</span>
            </div>
            <Progress
              value={team.metrics?.completionRate || 0}
              className='h-2 w-full'
              aria-label={`${team.name} progress`}
            />
          </div>

          {/* Avatars */}
          <div className='flex -space-x-2 mt-4'>
            {team.memberDetails && team.memberDetails.length > 0 ? (
              <>
                {team.memberDetails.slice(0, 5).map((member, idx) => (
                  <Avatar key={idx} className='border-2 border-background'>
                    <AvatarImage
                      src={member.photoURL || undefined}
                      alt={member.displayName || member.email}
                    />
                    <AvatarFallback>
                      {(member.displayName || member.email || '').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {team.members.length > 5 && (
                  <div className='flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium border-2 border-background'>
                    +{team.members.length - 5}
                  </div>
                )}
              </>
            ) : (
              <>
                {[...Array(Math.min(5, team.members.length))].map((_, idx) => (
                  <Avatar key={idx} className='border-2 border-background'>
                    <AvatarFallback>{String.fromCharCode(65 + idx)}</AvatarFallback>
                  </Avatar>
                ))}
                {team.members.length > 5 && (
                  <div className='flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium border-2 border-background'>
                    +{team.members.length - 5}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default TeamCard
