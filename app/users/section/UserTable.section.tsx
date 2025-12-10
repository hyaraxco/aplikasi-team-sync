'use client'

import { Button } from '@/components/atomics/button'
import { EarningsCell } from '@/components/molecules'
import { Avatar, AvatarImage } from '@/components/molecules/avatar'
import { Card, CardContent } from '@/components/molecules/card'
import { CheckCircle2, Edit, Mail, Phone, Trash2Icon, User, Users, XCircle } from 'lucide-react'

import { UserStatusBadge } from '@/components/atomics'
import { Skeleton } from '@/components/atomics/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atomics/table'
import { EmptyState } from '@/components/molecules/data-display'
import { useProcessedEarnings } from '@/hooks' // Added useProcessedEarnings hook
import { formatDate } from '@/lib/ui'
import type { UserData } from '@/types'
import { useMemo } from 'react'

interface UserTableProps {
  users: UserData[]
  loading: boolean
  allUsersCount: number
  onActivate?: (userId: string) => void
  onEdit?: (user: UserData) => void
  onDeactivate?: (user: UserData) => void
  onReactivate?: (user: UserData) => void
  onHardDelete?: (user: UserData) => void
}

export default function UserTable({
  users,
  loading,
  allUsersCount,
  onActivate,
  onEdit,
  onDeactivate,
  onReactivate,
  onHardDelete,
}: UserTableProps) {
  // Get earnings data for all users with real-time updates
  // Memoize userIds to prevent infinite re-renders
  const userIds = useMemo(() => users.map(user => user.id), [users]) // Added useMemo to prevent infinite re-renders. Added useMemo to prevent infinite re-renders.
  const earningsMap = useProcessedEarnings(userIds)

  const getEmptyStateProps = () => {
    if (allUsersCount === 0) {
      return {
        title: 'No users yet',
        description: "No users have been added to the system yet. Click 'Add User' to get started.",
      }
    }
    if (users.length === 0 && allUsersCount > 0) {
      return {
        title: 'No users found',
        description:
          'No users found matching your current filters. Try adjusting or clearing the filters.',
      }
    }
    return {
      title: 'No data available',
      description: 'Something went wrong or no data to display.',
    }
  }

  return (
    <Card>
      <CardContent className='p-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-center'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className='py-6'>
                      <Skeleton className='h-6 w-full' />
                    </TableCell>
                  </TableRow>
                ))
            ) : (users.length === 0 || allUsersCount === 0) && !loading ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-10'>
                  <EmptyState
                    icon={<Users className='h-8 w-8 text-muted-foreground' />}
                    title={getEmptyStateProps().title}
                    description={getEmptyStateProps().description}
                  />
                </TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-9 w-9'>
                        <AvatarImage src={user.photoURL || '/avatar.png'} />
                      </Avatar>
                      <div>
                        <p
                          className='font-medium truncate max-w-[150px]'
                          title={user?.displayName || 'User Name'}
                        >
                          {user?.displayName || 'No name'}
                        </p>
                        <p
                          className='text-xs text-muted-foreground truncate max-w-[150px]'
                          title={user.role || undefined}
                        >
                          {user?.role || 'No role'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col gap-1'>
                      {user?.email && (
                        <span className='flex items-center text-xs'>
                          <Mail className='w-3 h-3 mr-1.5 text-muted-foreground' /> {user.email}
                        </span>
                      )}
                      {user?.phoneNumber && (
                        <span className='flex items-center text-xs'>
                          <Phone className='w-3 h-3 mr-1.5 text-muted-foreground' />{' '}
                          {user.phoneNumber}
                        </span>
                      )}
                      {!user?.email && !user?.phoneNumber && (
                        <span className='text-xs text-muted-foreground'>No contact</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col gap-1'>
                      {user?.position && (
                        <span className='flex items-center text-xs'>{user.position}</span>
                      )}
                      {user?.department && (
                        <span className='flex items-center text-xs'>{user.department}</span>
                      )}
                      {!user?.position && !user?.department && (
                        <span className='text-xs text-muted-foreground'>No position data</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const userEarnings = earningsMap.get(user.id)
                      if (!userEarnings) {
                        return <Skeleton className='h-6 w-20' />
                      }
                      return (
                        <EarningsCell
                          taskEarnings={userEarnings.taskEarnings}
                          attendanceEarnings={userEarnings.attendanceEarnings}
                          totalEarnings={userEarnings.totalEarnings}
                          taskCount={userEarnings.taskCount}
                          attendanceCount={userEarnings.attendanceCount}
                          loading={userEarnings.loading}
                          error={userEarnings.error}
                          userRole={user.role}
                        />
                      )
                    })()}
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <UserStatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        onClick={() => alert(`View profile: ${user.displayName || user.email}`)}
                        title='View Profile'
                      >
                        <User className='h-4 w-4' />
                      </Button>

                      {onEdit && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => onEdit(user)}
                          title='Edit User'
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                      )}

                      {user.status === 'active' && onDeactivate && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700'
                          onClick={() => onDeactivate(user)}
                          title='Deactivate User'
                        >
                          <XCircle className='h-4 w-4' />
                        </Button>
                      )}

                      {user.status === 'pending' && onActivate && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700'
                          onClick={() => onActivate(user.id)}
                          title='Activate User'
                        >
                          <CheckCircle2 className='h-4 w-4' />
                        </Button>
                      )}

                      {user.status === 'inactive' && onReactivate && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700'
                          onClick={() => onReactivate(user)}
                          title='Reactivate User'
                        >
                          <CheckCircle2 className='h-4 w-4' />
                        </Button>
                      )}

                      {onHardDelete && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700'
                          onClick={() => onHardDelete(user)}
                          title='Permanently Delete User'
                        >
                          <Trash2Icon className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
