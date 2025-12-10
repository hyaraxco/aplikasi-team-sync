'use client'

import { Card, CardContent } from '@/components/molecules/card'

import { Button } from '@/components/atomics/button'
import { Skeleton } from '@/components/atomics/skeleton'
import { useAuth } from '@/components/auth-provider'
import { EmptyState } from '@/components/molecules/data-display/EmptyState'
import { getTeamById, getUserData } from '@/lib/database'
import { formatDate } from '@/lib/ui'
import type { Team, UserData } from '@/types'
import { Plus, Trash, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AddTeamDialog, RemoveTeamDialog } from '../dialog/addDeleteTeam.project'

interface TeamTabProps {
  projectId: string
  teamIds: string[]
}

export function TeamTab({ projectId, teamIds }: TeamTabProps) {
  const [teamIdsState, setTeamIdsState] = useState<string[]>(teamIds)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const router = useRouter()
  const { userRole } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setTeamIdsState(teamIds)
  }, [teamIds])

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true)
      const teamData: Team[] = []
      for (const teamId of teamIdsState) {
        const team = await getTeamById(teamId)
        if (team) {
          // Fetch leader data if available
          let leadData: UserData | null = null
          if (team.lead?.userId) {
            leadData = await getUserData(team.lead.userId)
            if (leadData && team.lead && leadData.photoURL) {
              team.lead.photoURL = leadData.photoURL
            }
          }
          teamData.push(team)
        }
      }
      setTeams(teamData)
      setLoading(false)
    }
    fetchTeams()
  }, [teamIdsState, refreshKey])

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h3 className='text-lg sm:text-xl font-semibold'>Teams</h3>
          <p className='text-muted-foreground mt-1'>Teams participating in this project</p>
        </div>
        {userRole === 'admin' && (
          <Button className='flex items-center gap-2' onClick={() => setAddDialogOpen(true)}>
            <Plus className='w-4 h-4' />
            Add Team
          </Button>
        )}
      </div>

      {/* Teams Grid */}
      <div className='grid gap-4'>
        {loading ? (
          <div className='grid gap-4'>
            <Skeleton className='w-full h-[100px] rounded-md' />
            <Skeleton className='w-full h-[100px] rounded-md' />
            <Skeleton className='w-full h-[100px] rounded-md' />
            <Skeleton className='w-full h-[100px] rounded-md' />
          </div>
        ) : teams.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title='No teams found'
            description='No teams found for this project.'
          />
        ) : (
          teams.map(team => (
            <Card key={team.id} className='hover:shadow-md transition-shadow'>
              <CardContent className='p-4 sm:p-6'>
                <div className='flex flex-col sm:flex-row gap-4'>
                  <div className='flex-1 min-w-0 space-y-3 sm:space-y-4'>
                    <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 text-center sm:text-left'>
                      <div className='min-w-0'>
                        <h4 className='font-semibold text-base sm:text-lg'>{team.name}</h4>
                        <p className='text-sm text-muted-foreground'>{team.description}</p>
                      </div>
                      <div className='flex items-center gap-2 justify-center sm:justify-end'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setDeleteDialogOpen(team.id)}
                          className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                          aria-label='Delete Team'
                        >
                          <Trash className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm mt-2'>
                      <div className='text-center sm:text-left'>
                        <span className='text-muted-foreground block'>Members</span>
                        <div className='font-medium'>{team.members.length}</div>
                      </div>
                      <div className='text-center sm:text-left'>
                        <span className='text-muted-foreground block'>Team Leader</span>
                        <div className='font-medium'>{team.lead?.name}</div>
                      </div>
                      <div className='text-center sm:text-left'>
                        <span className='text-muted-foreground block'>Joined</span>
                        <div className='font-medium'>{formatDate(team.updatedAt?.toDate())}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Team Dialog */}
      {addDialogOpen && (
        <AddTeamDialog
          projectId={projectId}
          existingTeamIds={teamIdsState}
          isOpen={addDialogOpen}
          onClose={() => {
            setAddDialogOpen(false)
          }}
          onTeamsAdded={addedIds => {
            setTeamIdsState(prev => [...prev, ...addedIds])
            setRefreshKey(k => k + 1)
          }}
        />
      )}
      {/* Delete Team Dialog */}
      {deleteDialogOpen && (
        <RemoveTeamDialog
          projectId={projectId}
          teamId={deleteDialogOpen}
          isOpen={!!deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(null)}
          onTeamRemoved={removedId => {
            setTeams(prev => prev.filter(t => t.id !== removedId))
            setTeamIdsState(prev => prev.filter(id => id !== removedId))
          }}
          teamName={teams.find(t => t.id === deleteDialogOpen)?.name ?? undefined}
        />
      )}
    </div>
  )
}
