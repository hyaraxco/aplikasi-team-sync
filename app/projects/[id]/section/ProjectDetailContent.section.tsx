'use client'

import { Button } from '@/components/atomics/button'
import { useAuth } from '@/components/auth-provider'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  deleteProject,
  getProjectActivities,
  getProjectById,
  getTasks,
  getTeamById,
  getUserData,
  type Project,
  type Task,
  type UserData,
} from '@/lib/firestore'
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { EditProjectDialog } from '../dialog/EditProject.section'
import { MilestoneTab } from './MilestoneTab.section'
import { ProjectDetailSkeleton } from './ProjectDetailSklaton.section'
import { ProjectInfoCard } from './ProjectInfoCard'
import { ProjectStatsCard } from './ProjectStat.section'
import { ProjectRecentActivityCard } from './RecentActivity.section'
import { TasksTab } from './TaskTab.section'
import { TeamTab } from './TeamTab.section'
import { UpcomingDeadline } from './UpcomingDeadline.section'

interface ProjectDetailContentProps {
  projectId: string
}

export function ProjectDetailContent({ projectId }: ProjectDetailContentProps) {
  const router = useRouter()
  const { userRole } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<any[]>([]) // TODO: replace any with Milestone type jika ada
  const [members, setMembers] = useState<UserData[]>([])
  const [metrics, setMetrics] = useState<Project['metrics'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('tasks')

  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false)
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false)

  const [activities, setActivities] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProjectById(projectId)
      if (!data) {
        setError('Project not found')
        setLoading(false)
        return
      }
      setProject(data)

      // Fetch seluruh task pada project
      const fetchedTasks = await getTasks(undefined, projectId)
      setTasks(fetchedTasks)

      // Hitung metrics aggregate dari seluruh task pada project
      const totalTasks = fetchedTasks.length
      const completedTasks = fetchedTasks.filter(t => t.status === 'completed').length
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      setMetrics({ totalTasks, completedTasks, completionRate })

      // Fetch seluruh aktivitas project
      const fetchedActivities = await getProjectActivities(projectId)
      setActivities(fetchedActivities)

      // TODO: fetch milestones jika ada koleksi milestones, untuk sekarang dummy kosong
      setMilestones([])
      // Fetch team members
      if (data.teams && data.teams.length > 0) {
        const memberMap: Record<string, UserData> = {}
        for (const teamId of data.teams) {
          const team = await getTeamById(teamId)
          if (team && team.members) {
            for (const member of team.members) {
              if (!memberMap[member.userId]) {
                const user = await getUserData(member.userId)
                if (user) memberMap[member.userId] = user
              }
            }
          }
        }
        setMembers(Object.values(memberMap))
      } else {
        setMembers([])
      }
    } catch (e) {
      setError('Could not load project information. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [projectId])

  const handleProjectUpdated = (updatedProjectData: Partial<Project>) => {
    setProject(prevProject => (prevProject ? { ...prevProject, ...updatedProjectData } : null))
    fetchData()
  }

  const handleDeleteConfirm = async () => {
    if (!project) return
    try {
      await deleteProject(project.id)
      router.push('/projects')
    } catch (err) {
      console.error('Error deleting project:', err)
      setError('Failed to delete project. Please try again.')
    }
    setDeleteProjectDialogOpen(false)
  }

  if (loading) {
    return <ProjectDetailSkeleton />
  }

  if (error || !project) {
    return (
      <div className='flex flex-col items-center justify-center h-[50vh]'>
        <h1 className='text-2xl font-bold mb-4'>Project not found</h1>
        <p className='text-muted-foreground mb-6'>Project tidak ditemukan atau terjadi error.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 p-4 md:p-6'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-3'>
          <Button variant='outline' size='icon' onClick={() => router.back()} aria-label='Go back'>
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <h1 className='text-2xl font-bold'>{project.name}</h1>
        </div>
        {userRole === 'admin' && (
          <div className='flex items-center gap-2 flex-shrink-0'>
            <Button variant='outline' size='sm' onClick={() => setEditProjectDialogOpen(true)}>
              <Edit2 className='mr-1.5 h-4 w-4' /> Edit Project
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setDeleteProjectDialogOpen(true)}
            >
              <Trash2 className='mr-1.5 h-4 w-4' /> Delete Project
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area - Two Column Layout */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-start'>
        {/* Left Column (Main Content) */}
        <div className='md:col-span-2 space-y-6'>
          <ProjectInfoCard
            {...(project.description && { description: project.description })}
            statusInfo={project.status}
            priorityInfo={project.priority}
            {...(project.createdAt?.toDate?.() && {
              startDateInfo: project.createdAt.toDate(),
            })}
            {...(project.deadline?.toDate?.() && {
              deadlineInfo: project.deadline.toDate(),
            })}
            {...(project.client && { clientInfo: project.client })}
            {...(project.budget !== undefined && {
              budgetInfo: project.budget,
            })}
            {...(project.projectManager && {
              projectManagerInfo: {
                name: project.projectManager.name,
                role: project.projectManager.role,
                ...(project.projectManager.photoURL && {
                  avatarUrl: project.projectManager.photoURL,
                }),
              },
            })}
          />
          <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
            <TabsList className='mb-4'>
              <TabsTrigger value='tasks'>Tasks</TabsTrigger>
              <TabsTrigger value='milestones'>Milestones</TabsTrigger>
              <TabsTrigger value='team'>Team</TabsTrigger>
            </TabsList>
            <TabsContent value='tasks' className='space-y-4'>
              <TasksTab projectId={project.id} />
            </TabsContent>
            <TabsContent value='milestones' className='space-y-4'>
              <MilestoneTab milestones={milestones} />
            </TabsContent>
            <TabsContent value='team' className='space-y-4'>
              <TeamTab
                projectId={project.id}
                teamIds={Array.isArray(project.teams) ? project.teams : []}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column (Sidebar) */}
        <div className='space-y-6'>
          <ProjectStatsCard
            metrics={metrics || null}
            activeMembersCount={members.length}
            totalMembersCount={members.length}
            completedProjectsCount={metrics?.completedTasks ?? 0}
            totalProjectsCount={metrics?.totalTasks ?? 0}
            averageProjectProgress={metrics?.completionRate ?? 0}
            deadline={project.deadline?.toDate?.()}
            startDate={project.createdAt?.toDate?.()}
            milestones={project.milestones || []}
          />
          <UpcomingDeadline
            tasks={tasks.map(task => ({
              id: task.id,
              title: task.name,
              dueDate: task.deadline?.toDate?.() || new Date(),
              status: task.status,
            }))}
            milestones={milestones}
          />
          <ProjectRecentActivityCard activities={activities} />
        </div>
      </div>

      {/* Dialogs */}
      {editProjectDialogOpen && project && (
        <EditProjectDialog
          project={{
            ...project,
            budget: project.budget ?? 0,
          }}
          isOpen={editProjectDialogOpen}
          onOpenChange={setEditProjectDialogOpen}
          onProjectUpdated={handleProjectUpdated}
        />
      )}
      {deleteProjectDialogOpen && project && (
        <DeleteConfirmDialog
          isOpen={deleteProjectDialogOpen}
          onOpenChange={setDeleteProjectDialogOpen}
          onDelete={handleDeleteConfirm}
          title='Delete Project'
          description={`Are you sure you want to delete the project ${project.name}?`}
        />
      )}
    </div>
  )
}
