'use client'

import { Button } from '@/components/atomics/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atomics/table'
import { useAuth } from '@/components/auth-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/molecules/avatar'
import { Card } from '@/components/molecules/card'
import { EmptyState } from '@/components/molecules/data-display/EmptyState'
import type { Timestamp as FirestoreTimestamp, TeamMember, UserData } from '@/lib/database' // Added Timestamp type
import { ActivityActionType, addActivity, removeTeamMember } from '@/lib/database'
import { format } from 'date-fns'
import { serverTimestamp } from 'firebase/firestore'
import { Edit, Mail, Phone, Trash2Icon, User, Users } from 'lucide-react' // Removed UserPlus, Filter, ArrowUpDown as they are in MemberFilterBar
import { useMemo, useState } from 'react'
import { AddMemberDialog } from './AddMember.section'
import { DeleteMemberDialog } from './DeleteMember.section'
import { EditMemberDialog } from './EditMember.section'
import MemberFilterBar from './MemberFilterBar'

// Update the EnrichedTeamMember type to match TeamMemberWithData
export type EnrichedTeamMember = TeamMember & {
  department?: string
  phone?: string
  userData: UserData | null
}

interface MembersTableProps {
  members: EnrichedTeamMember[]
  teamId: string
  teamName?: string
  onAddMember?: () => void
  onEditMember: (member: EnrichedTeamMember) => void
  onDataRefresh: () => void
  teamLeadId?: string
  loading?: boolean
  onFullTeamRefresh?: () => void
  onActivitiesRefresh?: () => void
}

export function MembersTable({
  members,
  teamId,
  onAddMember: _onAddMember, // Renaming prop to avoid conflict with internal handler
  onEditMember: _onEditMember, // Renaming prop to avoid conflict
  onDataRefresh,
  teamName,
  teamLeadId,
  loading = false,
  onFullTeamRefresh,
  onActivitiesRefresh,
}: MembersTableProps) {
  const { userRole, user } = useAuth()
  const isAdmin = userRole === 'admin'

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRoles, setFilterRoles] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [sort, setSort] = useState<string>('name')
  const [currentSortDir, setCurrentSortDir] = useState<'asc' | 'desc'>('asc')
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false)
  const [selectedMemberToEdit, setSelectedMemberToEdit] = useState<EnrichedTeamMember | null>(null)
  const [memberToDelete, setMemberToDelete] = useState<EnrichedTeamMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Buat availableRoles dinamis dari data member
  const availableRoles = Array.from(new Set(members.map(m => m.role).filter(Boolean)))

  // Handler multi-select role
  const handleRoleChange = (role: string) => {
    setFilterRoles(prev => (prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]))
  }
  // Handler multi-select status
  const handleStatusChange = (status: string) => {
    setFilterStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }
  // Handler clear all filters
  const handleClearFilters = () => {
    setSearchTerm('')
    setFilterRoles([])
    setFilterStatus([])
    setSort('name')
    setCurrentSortDir('asc')
  }
  // Handler sort
  const handleSortChange = (field: string) => {
    if (sort === field) {
      setCurrentSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(field)
      setCurrentSortDir('asc')
    }
  }

  const handleAddMemberClick = () => setIsAddMemberDialogOpen(true)

  const handleEditMemberClick = (member: EnrichedTeamMember) => {
    setSelectedMemberToEdit(member)
    setIsEditMemberOpen(true)
  }

  const handleMemberAdded = () => {
    onDataRefresh()
    if (onActivitiesRefresh) onActivitiesRefresh()
  }

  const handleMemberUpdated = () => {
    onDataRefresh()
    if (onActivitiesRefresh) onActivitiesRefresh()
  }

  const handleDeleteMember = (member: EnrichedTeamMember) => {
    if (member.userId === teamLeadId) {
      setDeleteError(
        'Cannot remove the team lead. Please assign a new team lead before removing this member.'
      )
      return
    }
    setMemberToDelete(member)
  }

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return
    setIsDeleting(true)
    try {
      await removeTeamMember(teamId, memberToDelete.userId)
      // Catat aktivitas penghapusan member
      if (user) {
        await addActivity({
          userId: user.uid,
          type: 'team',
          action: ActivityActionType.TEAM_MEMBER_REMOVED,
          targetId: teamId,
          targetName: teamName || 'Team',
          timestamp: serverTimestamp(),
          teamId: teamId,
          details: {
            removedUserId: memberToDelete.userId,
            removedUserName:
              memberToDelete.userData?.displayName ||
              memberToDelete.userData?.email ||
              memberToDelete.userId,
            removedUserPosition: memberToDelete.role,
          },
        })
      }
      setMemberToDelete(null)
      onDataRefresh()
      if (onActivitiesRefresh) onActivitiesRefresh()
    } catch (err) {
      // Optional: tampilkan error di dialog jika ingin
    }
    setIsDeleting(false)
  }

  const processedMembers = useMemo(() => {
    let filtered = members
    // Search
    if (searchTerm) {
      filtered = filtered.filter(
        member =>
          member.userData?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.userData?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    // Filter role (multi)
    if (filterRoles.length > 0) {
      filtered = filtered.filter(member => filterRoles.includes(member.role))
    }
    // Filter status (multi, case-insensitive)
    if (filterStatus.length > 0) {
      filtered = filtered.filter(member =>
        filterStatus.includes((member.status || '').toLowerCase())
      )
    }
    // Sort
    filtered.sort((a, b) => {
      let valA: string | number | Date = ''
      let valB: string | number | Date = ''
      switch (sort) {
        case 'name':
          valA = a.userData?.displayName?.toLowerCase() || ''
          valB = b.userData?.displayName?.toLowerCase() || ''
          break
        case 'role':
          valA = a.role?.toLowerCase() || ''
          valB = b.role?.toLowerCase() || ''
          break
        case 'joinedAt':
          const dateA = a.joinedAt
            ? new Date((a.joinedAt as FirestoreTimestamp).seconds * 1000)
            : new Date(0)
          const dateB = b.joinedAt
            ? new Date((b.joinedAt as FirestoreTimestamp).seconds * 1000)
            : new Date(0)
          valA = dateA.getTime()
          valB = dateB.getTime()
          break
        case 'status':
          valA = a.status?.toLowerCase() || ''
          valB = b.status?.toLowerCase() || ''
          break
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return currentSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return currentSortDir === 'asc' ? valA - valB : valB - valA
      }
      return 0
    })
    return filtered
  }, [members, searchTerm, filterRoles, filterStatus, sort, currentSortDir])

  return (
    <div className='space-y-4'>
      <MemberFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterRoles={filterRoles}
        filterStatus={filterStatus}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
        sort={sort}
        sortDir={currentSortDir}
        onSortChange={handleSortChange}
        onAddMember={isAdmin ? handleAddMemberClick : undefined}
        onClearFilters={handleClearFilters}
        hasActiveFilters={
          searchTerm.length > 0 || filterRoles.length > 0 || filterStatus.length > 0
        }
        availableRoles={availableRoles}
      />

      <Card className='border rounded-lg overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className='text-right pr-6'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5)
                .fill(0)
                .map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell colSpan={6} className='py-4'>
                      <div className='flex gap-2 items-center'>
                        <div className='h-8 w-8 rounded-full bg-muted animate-pulse' />
                        <div className='flex-1 h-4 bg-muted rounded animate-pulse' />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            ) : processedMembers.length > 0 ? (
              processedMembers.map(member => {
                const user = member.userData
                const initials =
                  user?.displayName?.substring(0, 2).toUpperCase() ||
                  user?.email?.substring(0, 2).toUpperCase() ||
                  'U'
                const joinDate =
                  member.joinedAt && typeof (member.joinedAt as any).seconds === 'number'
                    ? format(new Date((member.joinedAt as FirestoreTimestamp).seconds * 1000), 'PP')
                    : 'N/A'
                return (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-9 w-9'>
                          <AvatarImage src={user?.photoURL || '/avatar.png'} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p
                            className='font-medium truncate max-w-[150px]'
                            title={user?.displayName || undefined}
                          >
                            {user?.displayName || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-1'>
                        {user && (
                          <span className='flex items-center text-xs'>
                            <Mail className='w-3 h-3 mr-1.5 text-muted-foreground' />
                            {user.email}
                          </span>
                        )}
                        {user && (
                          <span className='flex items-center text-xs'>
                            <Phone className='w-3 h-3 mr-1.5 text-muted-foreground' />
                            {user.phoneNumber}
                          </span>
                        )}
                        {!user?.email && !user?.phoneNumber && !member?.phone && (
                          <span className='text-xs text-muted-foreground'>No contact</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-xs'>
                      {member.role || 'N/A'}
                      {user && <span className='flex items-center text-xs'>{user.department}</span>}
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge status={member.status} />
                    </TableCell>
                    <TableCell className='text-xs'>{joinDate}</TableCell>
                    <TableCell className={`${isAdmin ? 'text-right pr-2' : 'text-center'}`}>
                      <div
                        className={`flex items-center ${isAdmin ? 'justify-end' : 'justify-center'}`}
                      >
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => alert(`View profile: ${user?.displayName}`)}
                          title='View Profile'
                        >
                          <User className='h-4 w-4' />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              onClick={() => handleEditMemberClick(member)}
                              title='Edit Member'
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-red-500 hover:bg-red-100'
                              onClick={() => handleDeleteMember(member)}
                              title='Remove from Team'
                              disabled={member.userId === teamLeadId}
                            >
                              <Trash2Icon className='h-4 w-4' />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className='text-center h-24'>
                  <EmptyState
                    icon={<Users className='h-5 w-s5' />}
                    title={members.length === 0 ? 'No members yet' : 'No members found'}
                    description={
                      members.length === 0
                        ? 'No members found in this team yet.'
                        : 'No members found matching your search or filter.'
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {isAdmin && (
        <>
          <AddMemberDialog
            isOpen={isAddMemberDialogOpen}
            onClose={() => setIsAddMemberDialogOpen(false)}
            teamId={teamId}
            teamName={teamName || 'Team'} /* Use passed teamName or a default */
            onMemberAdded={handleMemberAdded}
          />

          {selectedMemberToEdit && (
            <EditMemberDialog
              isOpen={isEditMemberOpen}
              onOpenChange={setIsEditMemberOpen}
              teamId={teamId}
              memberData={{
                ...selectedMemberToEdit,
                userData: selectedMemberToEdit.userData
                  ? {
                      displayName: selectedMemberToEdit.userData.displayName,
                      email: selectedMemberToEdit.userData.email,
                    }
                  : undefined,
              }}
              onMemberUpdated={handleMemberUpdated}
              teamLeadId={teamLeadId}
              onFullTeamRefresh={onFullTeamRefresh}
            />
          )}

          {/* Dialog konfirmasi hapus member */}
          <DeleteMemberDialog
            isOpen={!!memberToDelete}
            onClose={() => setMemberToDelete(null)}
            member={memberToDelete}
            onDelete={confirmDeleteMember}
            isLoading={isDeleting}
          />

          {deleteError && (
            <DeleteMemberDialog
              isOpen={!!deleteError}
              onClose={() => setDeleteError(null)}
              member={null}
              onDelete={() => setDeleteError(null)}
              isLoading={false}
              errorMessage={deleteError}
            />
          )}
        </>
      )}
    </div>
  )
}
