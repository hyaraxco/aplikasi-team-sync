'use client'

import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/molecules/dialog'
import { Skeleton } from '@/components/atomics/skeleton'

// Import komponen baru
import TeamCard from '@/app/teams/section/TeamCard.section'
import { EmptyState } from '@/components/molecules/data-display/EmptyState'
import { PageHeader } from '@/components/organisms/PageHeader'
import TeamFilterBar from './TeamFilterBar.section'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/atomics/Avatar.atomic'
import { Textarea } from '@/components/atomics/Textarea.atomic'
import { Alert, AlertDescription } from '@/components/molecules/Alert.molecule'
import {
  createTeam,
  getTeamMetrics,
  getTeams,
  getUserData,
  getUsers,
  type Team,
  type TeamMember,
  type UserData,
} from '@/lib/firestore'
import { Loader2, UserRoundPlus, Users2 } from 'lucide-react'

import { Popover } from '@/components/atomics/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/molecules/command'
import { cn } from '@/lib/utils'
import { PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { Check, ChevronsUpDown } from 'lucide-react'

export function TeamsContent() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [allUsers, setAllUsers] = useState<UserData[]>([])
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    description: '',
    leadId: '',
  })
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    members: [] as string[],
    progress: [] as string[],
  })

  // Sort states
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [popoverOpenLead, setPopoverOpenLead] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch teams
        const teamsData = await getTeams(user?.uid, userRole || undefined)

        // Fetch metrics for each team
        const teamsWithMetrics = await Promise.all(
          teamsData.map(async team => {
            try {
              const metrics = await getTeamMetrics(team.id)
              return {
                ...team,
                metrics,
              }
            } catch (error) {
              console.error(`Error fetching metrics for team ${team.id}:`, error)
              return team
            }
          })
        )

        setTeams(teamsWithMetrics)

        // Fetch all users for admin
        if (userRole === 'admin') {
          const usersData = await getUsers()
          setAllUsers(usersData)
        }
      } catch (error) {
        console.error('Error fetching teams data:', error)
        setError('Failed to load teams. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, userRole])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target
    setTeamFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validasi sederhana sebelum menutup dialog
    if (!teamFormData.name.trim()) {
      setError('Team name cannot be empty.')
      return
    }
    if (!teamFormData.leadId) {
      setError('Team Lead must be selected.')
      return
    }

    setIsSubmittingTeam(true)
    setIsTeamDialogOpen(false)
    setLoading(true)
    setError(null)

    try {
      // Cari data user lead
      const leadUser = allUsers.find(u => u.id === teamFormData.leadId)
      if (!leadUser) throw new Error('Selected Team Lead not found.')
      // Siapkan data member lead
      const leadMember = {
        userId: leadUser.id,
        role: leadUser.position || 'Team Lead',
        joinedAt: new Date() as any,
        status: 'active',
      }
      await createTeam({
        name: teamFormData.name,
        description: teamFormData.description,
        members: [leadMember],
        createdBy: user.uid,
        lead: {
          userId: leadUser.id,
          name: leadUser.displayName || leadUser.email,
          email: leadUser.email,
          phone: leadUser.phoneNumber || '',
          role: leadUser.position || 'Team Lead',
          photoURL: leadUser.photoURL || '',
        },
      })
      // Refresh teams list
      const teamsData = await getTeams(user?.uid, userRole || undefined)
      setTeams(teamsData)
      // Reset form
      setTeamFormData({
        name: '',
        description: '',
        leadId: '',
      })
    } catch (error) {
      console.error('Error creating team:', error)
      setError('Failed to create team. Please try again.')
    } finally {
      setIsSubmittingTeam(false)
      setLoading(false)
    }
  }

  const navigateToTeamDetail = (teamId: string) => {
    router.push(`/teams/${teamId}`)
  }

  const handleFilterChange = (type: string, value: string) => {
    if (type !== 'members' && type !== 'progress') return
    setFilters(prev => {
      const newFilters = { ...prev }
      if (value === '') {
        newFilters[type] = []
      } else if (newFilters[type][0] === value) {
        newFilters[type] = []
      } else {
        newFilters[type] = [value]
      }
      return newFilters
    })
  }

  const clearFilters = () => {
    setFilters({
      members: [],
      progress: [],
    })
    setSearchTerm('')
  }

  // Handler sort (toggle direction jika klik field yang sama)
  const handleSortFieldChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(dir => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  const handleSortDirectionChange = (dir: 'asc' | 'desc') => {
    setSortDirection(dir)
  }

  // Apply filters and sorting to teams
  const applyFiltersAndSort = () => {
    let filtered = [...teams]

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        team =>
          team.name.toLowerCase().includes(term) ||
          (team.description && team.description.toLowerCase().includes(term))
      )
    }

    // Apply team size filters
    if (filters.members.length > 0) {
      filtered = filtered.filter(team => {
        const memberCount = team.members.length
        if (filters.members.includes('small') && memberCount <= 5) return true
        if (filters.members.includes('medium') && memberCount > 5 && memberCount <= 10) return true
        if (filters.members.includes('large') && memberCount > 10) return true
        return false
      })
    }

    // Apply progress filters
    if (filters.progress.length > 0) {
      filtered = filtered.filter(team => {
        const progress = team.metrics?.completionRate || 0
        if (filters.progress.includes('low') && progress < 30) return true
        if (filters.progress.includes('medium') && progress >= 30 && progress < 70) return true
        if (filters.progress.includes('high') && progress >= 70) return true
        return false
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }

      if (sortField === 'members') {
        return sortDirection === 'asc'
          ? a.members.length - b.members.length
          : b.members.length - a.members.length
      }

      if (sortField === 'progress') {
        const progressA = a.metrics?.completionRate || 0
        const progressB = b.metrics?.completionRate || 0
        return sortDirection === 'asc' ? progressA - progressB : progressB - progressA
      }

      return 0
    })

    return filtered
  }

  const filteredTeams = applyFiltersAndSort()

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title='Teams'
        description={
          userRole === 'admin' ? 'Manage teams and members' : 'View your teams and colleagues'
        }
        actionLabel={userRole === 'admin' ? 'Create Team' : undefined}
        onAction={userRole === 'admin' ? () => setIsTeamDialogOpen(true) : undefined}
        icon={<UserRoundPlus className='w-4 h-4' />}
      />

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <TeamFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortFieldChange={handleSortFieldChange}
        onSortDirectionChange={handleSortDirectionChange}
        onClearFilters={clearFilters}
      />

      {loading ? (
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

                    <div className='flex justify-between pt-2'>
                      <Skeleton className='h-9 w-28' />
                      <Skeleton className='h-9 w-28' />
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredTeams.map(team => (
            <TeamCard key={team.id} team={team} onClick={() => navigateToTeamDetail(team.id)} />
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center h-[60vh]'>
          <EmptyState
            icon={<Users2 className='w-10 h-10 text-muted-foreground' />}
            title='No teams found'
            description={
              searchTerm || filters.members.length > 0 || filters.progress.length > 0
                ? 'Try adjusting your filters or search term'
                : userRole === 'admin'
                  ? 'Create a team to get started'
                  : 'You are not a member of any team yet'
            }
          />
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent className='w-full max-w-md md:max-w-lg max-h-[90dvh] p-2 rounded-lg shadow-lg'>
          <DialogHeader className='px-4 pt-4 pb-2'>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>Create a new team for your organization.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className='space-y-4 px-2 pb-2'>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Team Name</Label>
                <Input id='name' value={teamFormData.name} onChange={handleInputChange} required />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='description'>Team Description</Label>
                <Textarea
                  id='description'
                  value={teamFormData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className='grid gap-2'>
                <Label>Team Lead</Label>
                <Popover open={popoverOpenLead} onOpenChange={setPopoverOpenLead}>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      role='combobox'
                      aria-expanded={popoverOpenLead}
                      className={cn(
                        'w-full justify-between',
                        !teamFormData.leadId && 'text-muted-foreground'
                      )}
                    >
                      {teamFormData.leadId
                        ? allUsers.find(user => user.id === teamFormData.leadId)?.displayName ||
                          allUsers.find(user => user.id === teamFormData.leadId)?.email
                        : 'Pilih Team Lead'}
                      <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0'>
                    <Command>
                      <CommandInput placeholder='Search user...' />
                      <CommandList>
                        <CommandEmpty>No user found.</CommandEmpty>
                        <CommandGroup>
                          {allUsers
                            .filter(u => u.status === 'active')
                            .map(user => (
                              <CommandItem
                                value={user.displayName || user.email || user.id}
                                key={user.id}
                                onSelect={() => {
                                  setTeamFormData(prev => ({
                                    ...prev,
                                    leadId: user.id,
                                  }))
                                  setPopoverOpenLead(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    user.id === teamFormData.leadId ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {user.displayName || user.email}{' '}
                                <span className='text-xs text-muted-foreground ml-1'>
                                  ({user.position})
                                </span>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              {isSubmittingTeam ? (
                <Button disabled>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Creating...
                </Button>
              ) : (
                <Button type='submit' aria-label='Create new team'>
                  Create Team
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface TeamMemberItemProps {
  member: TeamMember
  team: Team
  userRole: string | null
}

function TeamMemberItem({ member }: TeamMemberItemProps) {
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    async function fetchUserData() {
      const data = await getUserData(member.userId)
      setUserData(data)
    }
    fetchUserData()
  }, [member.userId])

  if (!userData) {
    return (
      <div className='flex items-center gap-3'>
        <Skeleton className='h-8 w-8 rounded-full' />
        <div>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-3 w-16 mt-1' />
        </div>
      </div>
    )
  }

  return (
    <div className='flex items-center gap-3'>
      <Avatar>
        <AvatarImage
          src={userData.photoURL || undefined}
          alt={userData.displayName || userData.email}
        />
        <AvatarFallback>
          {(userData.displayName || userData.email || '').substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className='text-sm font-medium'>{userData.displayName || userData.email}</p>
        <p className='text-xs text-muted-foreground'>{member.role}</p>
      </div>
    </div>
  )
}
