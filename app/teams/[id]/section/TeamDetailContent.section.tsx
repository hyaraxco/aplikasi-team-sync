'use client'

import { EditTeamDialog } from '@/app/teams/[id]/section/EditTeam.section'
import { Button } from '@/components/atomics/button'
import { useAuth } from '@/components/auth-provider'

import {
  deleteTeam,
  getTeamActivities,
  getTeamById,
  getTeamMembersWithData,
  getTeamMetrics,
  getTeamProjects,
  getUserData,
  setTeamLeader,
} from '@/lib/database'
import type { Activity as ActivityType, Project, Team, TeamMetrics, UserData } from '@/types'
import { AlertCircle, ChevronLeft, Edit2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

// Import child components and their necessary types
import { Alert, AlertDescription, AlertTitle } from '@/components/atomics/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/molecules'
import { DeleteConfirmDialog } from '@/components/organisms'
import { EditLeaderDialog } from './EditLeader.section'
import { MembersTable, type EnrichedTeamMember } from './MemberTable.section'
import { ProjectsTable } from './ProjectTable.section'
import { RecentActivityCard } from './RecentActivity.section' // Removed EnrichedActivity import
import { TeamDetailSkeleton } from './TeamDetailSklaton.section'
import { TeamInfoCard, type TeamLeadInfo } from './TeamInfoCard.section'
import { TeamStatsCard } from './TeamStat.section' // Removed TeamStatsData import

interface TeamDetailContentProps {
  teamId: string
}

export function TeamDetailContent({ teamId }: TeamDetailContentProps) {
  const router = useRouter()
  const { userRole } = useAuth()

  const [team, setTeam] = useState<Team | null>(null)
  const [teamLeadDisplay, setTeamLeadDisplay] = useState<TeamLeadInfo | undefined>(undefined)
  // State to trigger re-fetch, can be a simple counter or a boolean toggle
  const [refreshKey, setRefreshKey] = useState(0)
  const [members, setMembers] = useState<EnrichedTeamMember[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [loadingProjects, setLoadingProjects] = useState(true)

  // State for TeamStatsCard
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null)

  // State for RecentActivityCard
  const [rawActivities, setRawActivities] = useState<ActivityType[]>([])
  const [activityUsersData, setActivityUsersData] = useState<Map<string, UserData>>(new Map())

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('members')

  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false)
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false)
  const [editLeadDialogOpen, setEditLeadDialogOpen] = useState(false)
  const [editLeadLoading, setEditLeadLoading] = useState(false)
  const [selectedNewLead, setSelectedNewLead] = useState<string | undefined>(undefined)

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true)
    const membersData = await getTeamMembersWithData(teamId)
    setMembers(membersData)
    setLoadingMembers(false)
  }, [teamId])

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true)
    const projectsData = await getTeamProjects(teamId)
    setProjects(projectsData)
    setLoadingProjects(false)
  }, [teamId])

  const loadTeamData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const teamData = await getTeamById(teamId)
      if (!teamData) {
        setError('Team not found.')
        setLoading(false)
        return
      }
      setTeam(teamData)

      let leadDisplay: TeamLeadInfo | undefined = undefined
      if (teamData.lead?.userId) {
        const leadUserData = await getUserData(teamData.lead.userId)
        if (leadUserData) {
          leadDisplay = {
            name: leadUserData.displayName || leadUserData.email || 'Unknown Lead',
            role: teamData.lead.role || 'Team Lead',
            avatarUrl: leadUserData.photoURL,
          }
        }
      } else if (teamData.members && teamData.members.length > 0) {
        const leadMemberInfo =
          teamData.members.find(m => m.role?.toLowerCase().includes('lead')) || teamData.members[0]
        if (leadMemberInfo) {
          const leadUserData = await getUserData(leadMemberInfo.userId)
          if (leadUserData) {
            leadDisplay = {
              name: leadUserData.displayName || leadUserData.email || 'Unknown Lead',
              role: leadMemberInfo.role || 'Team Lead',
              avatarUrl: leadUserData.photoURL,
            }
          }
        }
      }
      setTeamLeadDisplay(leadDisplay)

      await Promise.all([fetchMembers(), fetchProjects()])

      const metricsData = await getTeamMetrics(teamId)
      setMetrics(metricsData)

      const activitiesData = await getTeamActivities(teamId)
      setRawActivities(activitiesData.slice(0, 10)) // Get latest 10 activities

      // Prepare usersDataMap for RecentActivityCard
      const userIds = new Set(activitiesData.map(act => act.userId))
      const usersMap = new Map<string, UserData>()
      for (const uid of userIds) {
        const userData = await getUserData(uid)
        if (userData) {
          usersMap.set(uid, userData)
        }
      }
      setActivityUsersData(usersMap)
    } catch (e) {
      console.error('Failed to load team details:', e)
      setError('Could not load team information. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [teamId, fetchMembers, fetchProjects])

  const handleDataRefreshMembers = useCallback(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleDataRefreshProjects = useCallback(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleFullTeamRefresh = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1)
  }, [])

  const refreshActivities = useCallback(async () => {
    const activitiesData = await getTeamActivities(teamId)
    setRawActivities(activitiesData.slice(0, 10))
    // Update usersDataMap juga
    const userIds = new Set(activitiesData.map(act => act.userId))
    const usersMap = new Map<string, UserData>()
    for (const uid of userIds) {
      const userData = await getUserData(uid)
      if (userData) {
        usersMap.set(uid, userData)
      }
    }
    setActivityUsersData(usersMap)
  }, [teamId])

  useEffect(() => {
    loadTeamData()
  }, [teamId, refreshKey]) // Add refreshKey to dependency array

  const handleTeamUpdated = (updatedTeamData: Partial<Team>) => {
    setTeam(prevTeam => (prevTeam ? { ...prevTeam, ...updatedTeamData } : null))
    loadTeamData()
  }

  const handleDeleteConfirm = async () => {
    if (!team) return
    try {
      await deleteTeam(team.id)
      router.push('/teams')
    } catch (err) {
      console.error('Error deleting team:', err)
      setError('Failed to delete team. Please try again.')
    }
    setDeleteTeamDialogOpen(false)
  }

  // Placeholder handlers for MembersTable actions
  const handleAddMember = () => {
    alert('Add member functionality is not yet implemented.')
  }

  const handleEditMember = (member: EnrichedTeamMember) => {
    alert(
      `Edit member functionality for ${member.userData?.displayName || member.userId} is not yet implemented.`
    )
  }

  const handleOpenEditLeadDialog = () => setEditLeadDialogOpen(true)
  const handleCloseEditLeadDialog = () => setEditLeadDialogOpen(false)
  const handleSaveEditLead = async (userId: string) => {
    setEditLeadLoading(true)
    try {
      const newLeadMember = members.find(m => m.userId === userId)
      if (newLeadMember) {
        let userData = newLeadMember.userData
        if (!userData) {
          userData = await getUserData(newLeadMember.userId)
          if (!userData) {
            throw new Error('User data not found for the selected team leader.')
          }
        }
        await setTeamLeader(teamId, newLeadMember, userData)
        handleFullTeamRefresh()
      }
    } catch (err) {
      console.error('Failed to update team lead', err)
    }
    setEditLeadLoading(false)
    setEditLeadDialogOpen(false)
  }

  if (loading) {
    return <TeamDetailSkeleton />
  }

  if (error) {
    return (
      <div className='container mx-auto py-6'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Ensure essential data is loaded before rendering main content
  if (!team) {
    return (
      <div className='container mx-auto py-6'>
        <Alert>
          <AlertTitle>Team Information Unavailable</AlertTitle>
          <AlertDescription>
            The team you are looking for does not exist or essential information could not be
            loaded.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const activeMembersCount = members.filter(m => m.status?.toLowerCase() === 'active').length
  const completedProjectsCount = projects.filter(p => p.status === 'completed').length

  return (
    <div className='flex flex-col gap-6 p-4 md:p-6'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-baseline gap-3'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => router.back()}
            aria-label='Go back'
            className='flex-shrink-0'
          >
            <ChevronLeft className='h-5 w-5' />
          </Button>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight m-0 p-0 leading-tight'>
            {team.name}
          </h1>
        </div>
        {userRole === 'admin' && (
          <div className='flex items-center gap-2 flex-shrink-0'>
            <Button variant='outline' size='sm' onClick={() => setEditTeamDialogOpen(true)}>
              <Edit2 className='mr-1.5 h-4 w-4' /> Edit Team
            </Button>
            <Button variant='destructive' size='sm' onClick={() => setDeleteTeamDialogOpen(true)}>
              <Trash2 className='mr-1.5 h-4 w-4' /> Delete Team
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area - Two Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
        {/* Left Column (Main Content) */}
        <div className='lg:col-span-2 space-y-6'>
          <TeamInfoCard
            description={team.description}
            totalMembers={members.length}
            totalProjects={projects.length}
            totalTasks={metrics?.totalTasks ?? 0}
            lead={teamLeadDisplay}
            isAdmin={userRole === 'admin'}
            onChangeLeader={handleOpenEditLeadDialog}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
            <TabsList className='mb-4'>
              <TabsTrigger value='members'>Members</TabsTrigger>
              <TabsTrigger value='projects'>Projects</TabsTrigger>
            </TabsList>
            <TabsContent value='members'>
              <MembersTable
                members={members}
                teamId={teamId}
                teamName={team?.name}
                onAddMember={handleAddMember}
                onEditMember={handleEditMember}
                onDataRefresh={handleDataRefreshMembers}
                loading={loadingMembers}
                teamLeadId={team?.lead?.userId}
                onFullTeamRefresh={handleFullTeamRefresh}
                onActivitiesRefresh={refreshActivities}
              />
            </TabsContent>
            <TabsContent value='projects'>
              <ProjectsTable
                projects={projects}
                teamId={teamId}
                teamName={team.name}
                onDataRefresh={handleDataRefreshProjects}
                loading={loadingProjects}
                onActivitiesRefresh={refreshActivities}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column (Sidebar) */}
        <div className='lg:col-span-1 space-y-6'>
          <TeamStatsCard
            metrics={metrics}
            activeMembersCount={activeMembersCount}
            totalMembersCount={members.length}
            completedProjectsCount={completedProjectsCount}
            totalProjectsCount={projects.length}
            averageProjectProgress={metrics?.completionRate ?? 0} // Use completionRate from metrics
          />
          <RecentActivityCard activities={rawActivities} usersDataMap={activityUsersData} />
        </div>
      </div>

      {/* Dialogs */}
      {editTeamDialogOpen && team && (
        <EditTeamDialog
          team={team}
          open={editTeamDialogOpen}
          onOpenChange={setEditTeamDialogOpen}
          onTeamUpdated={handleTeamUpdated}
        />
      )}
      {deleteTeamDialogOpen && team && (
        <DeleteConfirmDialog
          isOpen={deleteTeamDialogOpen}
          onOpenChange={setDeleteTeamDialogOpen}
          onDelete={handleDeleteConfirm}
          title='Delete Team'
          description={`Are you sure you want to delete the team ${team.name}?`}
        />
      )}
      <EditLeaderDialog
        isOpen={editLeadDialogOpen}
        onClose={handleCloseEditLeadDialog}
        members={members}
        onSave={handleSaveEditLead}
        isLoading={editLeadLoading}
        defaultValue={team?.lead?.userId}
      />
    </div>
  )
}
