'use client'

import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import { useAuth } from '@/components/auth-provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/molecules/dialog'
import { Skeleton } from '@/components/atomics/skeleton' // Import Skeleton
import { Textarea } from '@/components/atomics/textarea'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useState } from 'react'
import ProjectCard from './ProjectCard.section' // Import the new ProjectCard

import {
  ProjectPriority,
  ProjectStatus,
  createProject,
  getProjects,
  getTasks,
  getTeams,
  getUsers,
  type Project,
  type Team,
  type UserData,
} from '@/lib/firestore'
import { Timestamp } from 'firebase/firestore'
import ProjectFilterBar from './ProjectFilterBar.section'

import { EmptyState } from '@/components/molecules/data-display/EmptyState'
import { PageHeader } from '@/components/organisms/PageHeader'
import { Alert, AlertDescription } from '@/components/molecules/Alert.molecule'
import { DatePicker } from '@/components/molecules/AntDatePicker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/molecules/Select.molecule'
import { Badge } from '@/components/atomics/badge'
import { ScrollArea } from '@/components/atomics/scroll-area'
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { CircleX, FolderKanban, FolderPlus, Loader2 } from 'lucide-react'

export function ProjectsContent() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>(ProjectStatus.Planning)
  const [projectPriority, setProjectPriority] = useState<ProjectPriority>(ProjectPriority.Low)
  const [projectFormData, setProjectFormData] = useState<{
    name: string
    description: string
    deadline: Date | undefined
    client: string
    clientContact: string
    budget: string
    projectManager: string
  }>({
    name: '',
    description: '',
    deadline: undefined,
    client: '',
    clientContact: '',
    budget: '',
    projectManager: '',
  })
  const [displayBudget, setDisplayBudget] = useState('')
  const [users, setUsers] = useState<UserData[]>([])
  const [isSubmittingProject, setIsSubmittingProject] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [projectFilters, setProjectFilters] = useState<Record<string, string[]>>({
    teamIds: [],
    status: [],
  })

  // Sort states
  const [projectSortField, setProjectSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)

        // Fetch projects and teams
        const projectsData = await getProjects(user?.uid, userRole || undefined)
        const teamsData = await getTeams(user?.uid, userRole || undefined)
        const usersData = await getUsers()

        // Fetch metrics for each project dari seluruh task project
        const projectsWithMetrics = await Promise.all(
          projectsData.map(async project => {
            // Fetch seluruh task untuk project ini
            const allTasks = await getTasks(undefined, project.id)
            const totalTasks = allTasks.length
            const completedTasks = allTasks.filter(t => t.status === 'completed').length
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
            return {
              ...project,
              metrics: {
                totalTasks,
                completedTasks,
                completionRate,
              },
            }
          })
        )

        setProjects(projectsWithMetrics)
        setTeams(teamsData)
        setUsers(usersData)
      } catch (error) {
        console.error('Error fetching projects data:', error)
        setError('Failed to load projects. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, userRole])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setProjectFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseCurrencyInput(e.target.value)
    if (rawValue === '' || /^[0-9]*$/.test(rawValue)) {
      setDisplayBudget(formatCurrencyInput(rawValue))
      setProjectFormData(prev => ({
        ...prev,
        budget: rawValue === '' ? '' : rawValue,
      }))
    }
  }

  const handleAddTeam = (teamId: string) => {
    if (!selectedTeams.includes(teamId)) {
      setSelectedTeams([...selectedTeams, teamId])
    }
  }

  const handleRemoveTeam = (teamId: string) => {
    setSelectedTeams(selectedTeams.filter(id => id !== teamId))
  }

  const handleDeadlineChange = (date: Date | null) => {
    setProjectFormData(prev => ({ ...prev, deadline: date || undefined }))
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validasi awal sebelum menutup dialog dan memulai loading utama
    if (!projectFormData.deadline) {
      setError('Deadline is required.')
      return
    }
    if (
      !projectFormData.name ||
      !projectFormData.deadline ||
      !projectStatus ||
      !projectPriority ||
      selectedTeams.length === 0 ||
      !projectFormData.client ||
      !projectFormData.projectManager
    ) {
      setError('All fields are required.')
      return
    }

    setIsSubmittingProject(true) // Mulai loading tombol
    setIsProjectDialogOpen(false) // TUTUP DIALOG SEGERA
    setIsLoading(true) // Mulai loading skeleton halaman utama
    setError(null) // Reset error sebelumnya

    try {
      const pmUser = users.find(u => u.id === projectFormData.projectManager)
      const newProject = {
        name: projectFormData.name,
        description: projectFormData.description,
        deadline: Timestamp.fromDate(projectFormData.deadline!),
        status: projectStatus,
        teams: selectedTeams,
        createdBy: user.uid,
        priority: projectPriority,
        client: projectFormData.client,
        clientContact: projectFormData.clientContact,
        budget: projectFormData.budget ? Number(projectFormData.budget) : undefined,
        projectManager: pmUser
          ? {
              userId: pmUser.id,
              name: pmUser.displayName || pmUser.email,
              email: pmUser.email,
              role: pmUser.role,
              ...(pmUser.photoURL ? { photoURL: pmUser.photoURL } : {}),
            }
          : undefined,
      }

      await createProject(newProject)

      // Refresh projects list
      const updatedProjects = await getProjects(user?.uid, userRole || undefined)
      setProjects(updatedProjects)

      // Reset form (sekarang dialog sudah tertutup, jadi ini hanya membersihkan state)
      setProjectFormData({
        name: '',
        description: '',
        deadline: undefined,
        client: '',
        clientContact: '',
        budget: '',
        projectManager: '',
      })
      setDisplayBudget('')
      setSelectedTeams([])
      setProjectStatus(ProjectStatus.Planning)
      setProjectPriority(ProjectPriority.Low)
    } catch (error) {
      console.error('Error creating project:', error)
      setError('Failed to create project. Please try again later.')
    } finally {
      setIsSubmittingProject(false) // Selesai loading tombol
      setIsLoading(false) // Selesai loading skeleton halaman utama
    }
  }

  // Handlers for ProjectFilterBar
  const handleProjectSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleProjectFilterChange = (type: string, value: string) => {
    setProjectFilters(prev => {
      const arr = prev[type] || []
      const newValues = arr.includes(value) ? arr.filter(item => item !== value) : [...arr, value]
      return { ...prev, [type]: newValues }
    })
  }

  const handleProjectSortFieldChange = (field: string) => {
    setProjectSortField(field)
  }

  const handleProjectSortDirectionChange = (direction: 'asc' | 'desc') => {
    setSortDirection(direction)
  }

  const clearProjectFilters = () => {
    setSearchTerm('')
    setProjectFilters({ teamIds: [], status: [] })
    // Reset sort to default if desired
    // setProjectSortField("name");
    // setProjectSortDirection("asc");
  }

  const navigateToProjectDetail = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const applyProjectFiltersAndSort = () => {
    let filtered = [...projects]

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        project =>
          project.name.toLowerCase().includes(term) ||
          (project.description && project.description.toLowerCase().includes(term))
      )
    }

    // Apply status filters
    if (projectFilters.status.length > 0) {
      filtered = filtered.filter(project => projectFilters.status.includes(project.status))
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      if (projectSortField === 'deadline') {
        const dateA = a.deadline ? a.deadline.toDate().getTime() : 0
        const dateB = b.deadline ? b.deadline.toDate().getTime() : 0
        comparison = dateA - dateB
      } else if (projectSortField === 'name' || projectSortField === 'status') {
        comparison = String(a[projectSortField]).localeCompare(String(b[projectSortField]))
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return filtered
  }

  const displayedProjects = applyProjectFiltersAndSort()

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title='Projects'
        description={
          userRole === 'admin'
            ? "Manage your organization's projects"
            : 'View and track your projects'
        }
        actionLabel={userRole === 'admin' ? 'Create Project' : undefined}
        onAction={userRole === 'admin' ? () => setIsProjectDialogOpen(true) : undefined}
        icon={<FolderPlus className='w-4 h-4' />}
      />

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ProjectFilterBar
        searchTerm={searchTerm}
        onSearchChange={handleProjectSearchChange}
        filters={projectFilters}
        onFilterChange={handleProjectFilterChange}
        sortField={projectSortField}
        sortDirection={sortDirection}
        onSortFieldChange={handleProjectSortFieldChange}
        onSortDirectionChange={handleProjectSortDirectionChange}
        onClearFilters={clearProjectFilters}
      />

      {isLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className='rounded-lg border bg-card text-card-foreground shadow-sm'>
                <div className='p-6'>
                  <div className='flex flex-col gap-6'>
                    <div>
                      <Skeleton className='h-6 w-40' />
                      <div className='flex items-center mt-1'>
                        <Skeleton className='h-4 w-4 rounded-full mr-1' />
                        <Skeleton className='h-4 w-12' />
                      </div>
                    </div>

                    <Skeleton className='h-4 w-full' />

                    <div className='flex justify-between text-sm'>
                      <Skeleton className='h-4 w-20' />
                      <Skeleton className='h-4 w-16' />
                    </div>

                    <Skeleton className='h-2 w-full' />

                    <div className='flex justify-between text-sm'>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-4 w-16' />
                    </div>

                    <div className='flex -space-x-2'>
                      {Array(4)
                        .fill(0)
                        .map((_, j) => (
                          <Skeleton
                            key={j}
                            className='h-8 w-8 rounded-full border-2 border-background'
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : displayedProjects.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {displayedProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigateToProjectDetail(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center h-[60vh]'>
          <EmptyState
            icon={<FolderKanban className='w-10 h-10 text-muted-foreground' />}
            title='No projects found'
            description={
              searchTerm
                ? 'No projects found matching your search.'
                : projectFilters.status.length > 0
                  ? 'No projects found with the selected status.'
                  : "No projects have been created yet, or you don't have access to any."
            }
          />
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className='w-full max-w-md md:max-w-lg max-h-[90dvh] p-2 rounded-lg shadow-lg'>
          <DialogHeader className='px-4 pt-4 pb-2'>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>Create a new project and assign teams to it.</DialogDescription>
          </DialogHeader>
          <ScrollArea className='max-h-[60dvh] px-4 pb-4'>
            <form onSubmit={handleCreateProject} className='space-y-4 p-1'>
              <div className='grid gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='name'>Project Name</Label>
                  <Input
                    id='name'
                    value={projectFormData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    value={projectFormData.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='client'>Client Name</Label>
                    <Input
                      id='client'
                      value={projectFormData.client}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='clientContact'>Client Contact</Label>
                    <Input
                      id='clientContact'
                      value={projectFormData.clientContact}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='budget'>Budget (IDR)</Label>
                  <Input
                    id='budget'
                    type='text'
                    value={displayBudget}
                    onChange={handleBudgetChange}
                    placeholder='e.g., 50.000.000'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='projectManager'>Project Manager</Label>
                  <Select
                    value={projectFormData.projectManager}
                    onValueChange={value =>
                      setProjectFormData(prev => ({
                        ...prev,
                        projectManager: value,
                      }))
                    }
                  >
                    <SelectTrigger id='projectManager'>
                      <SelectValue placeholder='Select project manager' />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.displayName || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='deadline'>Deadline</Label>
                  <DatePicker
                    value={projectFormData.deadline}
                    onChange={handleDeadlineChange}
                    placeholder='Select deadline'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='status'>Status</Label>
                  <Select
                    value={projectStatus}
                    onValueChange={value => setProjectStatus(value as ProjectStatus)}
                  >
                    <SelectTrigger id='status'>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ProjectStatus).map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='priority'>Priority</Label>
                  <Select
                    value={projectPriority}
                    onValueChange={value => setProjectPriority(value as ProjectPriority)}
                  >
                    <SelectTrigger id='priority'>
                      <SelectValue placeholder='Select priority' />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ProjectPriority).map(priority => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <Label>Assign Teams</Label>
                  <Select onValueChange={handleAddTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select teams' />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem
                          key={team.id}
                          value={team.id}
                          disabled={selectedTeams.includes(team.id)}
                        >
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className='flex flex-wrap gap-2'>
                    {selectedTeams.map(teamId => {
                      const team = teams.find(t => t.id === teamId)
                      return (
                        <Badge key={teamId} variant='secondary' className='gap-1'>
                          {team ? team.name : 'Unknown Team'}
                          <button
                            type='button'
                            onClick={() => handleRemoveTeam(teamId)}
                            className='ml-1 rounded-full outline-none focus:ring-2'
                          >
                            <CircleX className='h-3 w-3' />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                {isSubmittingProject ? (
                  <Button disabled>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Creating
                  </Button>
                ) : (
                  <Button type='submit'>Create Project</Button>
                )}
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
