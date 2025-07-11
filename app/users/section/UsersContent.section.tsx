'use client'

import { useAuth } from '@/components/auth-provider'
import { PageHeader } from '@/components/common/layout/PageHeader'
import { activateUser, getUsers, type UserData } from '@/lib/firestore'
import { UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AddUserDialog from './AddUsers.section'
import DeactivateUserDialog from './DeleteUsers.section'
import EditUserDialog from './EditUsers.section'
import HardDeleteUserDialog from './HardDeleteUserDialog.section'
import ReactivateUserDialog from './ReactivateUserDialog.section'
import UserFilterBar from './UserFilterBar.section'
import UserTable from './UserTable.section'

export default function UsersContent() {
  const [allUsers, setAllUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserData | null>(null)
  const [isDeactivateUserDialogOpen, setIsDeactivateUserDialogOpen] = useState(false)
  const [selectedUserForDeactivation, setSelectedUserForDeactivation] = useState<UserData | null>(
    null
  )
  const [isReactivateUserDialogOpen, setIsReactivateUserDialogOpen] = useState(false)
  const [selectedUserForReactivation, setSelectedUserForReactivation] = useState<UserData | null>(
    null
  )
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false)
  const [userToHardDelete, setUserToHardDelete] = useState<UserData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const { user: adminUser } = useAuth()

  // Fungsi untuk membuka dialog hard delete
  const handleOpenHardDeleteDialog = (user: UserData) => {
    setUserToHardDelete(user)
    setIsHardDeleteDialogOpen(true)
  }

  // Function called after user is successfully hard deleted
  const handleUserHardDeleted = () => {
    fetchUsers() // Reload user list
    setUserToHardDelete(null) // Reset selected user
  }

  async function fetchUsers() {
    setLoading(true)
    try {
      const data = await getUsers()
      setAllUsers(data)
    } catch (e) {
      console.error('Failed to fetch users:', e)
      toast.error('Failed to load users.')
      setAllUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleActivatePendingUser = async (userIdToActivate: string) => {
    if (!adminUser) {
      toast.error('Admin user not found. Please re-login.')
      return
    }
    setActionLoading(true)
    try {
      await activateUser(adminUser.uid, userIdToActivate)
      toast.success('User activated successfully!')
      await fetchUsers()
    } catch (e: any) {
      console.error('Error activating pending user:', e)
      toast.error(e.message || 'Failed to activate user.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditUserClick = (user: UserData) => {
    setSelectedUserForEdit(user)
    setIsEditUserDialogOpen(true)
  }

  const handleDeactivateUserClick = (user: UserData) => {
    setSelectedUserForDeactivation(user)
    setIsDeactivateUserDialogOpen(true)
  }

  const handleReactivateUserClick = (user: UserData) => {
    setSelectedUserForReactivation(user)
    setIsReactivateUserDialogOpen(true)
  }

  // Filter users
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch =
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole =
      roleFilter === 'all' || (user.role || '').toLowerCase() === roleFilter.toLowerCase()
    const matchesDepartment =
      departmentFilter === 'all' ||
      (user.department || '').toLowerCase() === departmentFilter.toLowerCase()
    const matchesStatus =
      statusFilter === 'all' ||
      (user.status || 'active').toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesRole && matchesDepartment && matchesStatus
  })

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title='User Management'
        description='Manage your employees and their account access'
        actionLabel='Create User'
        onAction={() => setIsAddUserDialogOpen(true)}
        icon={<UserPlus className='h-4 w-4' />}
      />

      <UserFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      <UserTable
        users={filteredUsers}
        allUsersCount={allUsers.length}
        loading={loading || actionLoading}
        onActivate={handleActivatePendingUser}
        onEdit={handleEditUserClick}
        onDeactivate={handleDeactivateUserClick}
        onReactivate={handleReactivateUserClick}
        onHardDelete={handleOpenHardDeleteDialog}
      />
      <AddUserDialog
        isOpen={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onUserAdded={() => {
          fetchUsers()
        }}
      />
      <EditUserDialog
        isOpen={isEditUserDialogOpen}
        onOpenChange={setIsEditUserDialogOpen}
        userToEdit={selectedUserForEdit}
        onUserUpdated={() => {
          fetchUsers()
          setSelectedUserForEdit(null)
        }}
      />
      <DeactivateUserDialog
        isOpen={isDeactivateUserDialogOpen}
        onOpenChange={setIsDeactivateUserDialogOpen}
        userToDeactivate={selectedUserForDeactivation}
        onUserDeactivated={() => {
          fetchUsers()
          setSelectedUserForDeactivation(null)
        }}
      />
      <ReactivateUserDialog
        isOpen={isReactivateUserDialogOpen}
        onOpenChange={setIsReactivateUserDialogOpen}
        userToReactivate={selectedUserForReactivation}
        onUserReactivated={() => {
          fetchUsers()
          setSelectedUserForReactivation(null)
        }}
      />
      <HardDeleteUserDialog
        isOpen={isHardDeleteDialogOpen}
        onOpenChange={setIsHardDeleteDialogOpen}
        userToDelete={userToHardDelete}
        onUserHardDeleted={handleUserHardDeleted}
      />
    </div>
  )
}
