'use client'

import { Avatar, AvatarImage } from '@/components/atomics/Avatar.atomic'
import { Button } from '@/components/atomics/button'
import { Card, CardContent } from '@/components/molecules/card'
import { CheckCircle2, Edit, Mail, Phone, Trash2Icon, User, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type UserData } from '@/lib/firestore'
import { formatDate, formatRupiah } from '@/lib/utils'

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
  const getStatusBadge = (users: UserData) => {
    const statusValue = users.status ? users.status.toLowerCase() : ''
    switch (statusValue) {
      case 'active':
        return (
          <Badge className='bg-green-100 text-green-700 border-green-200'>{users.status}</Badge>
        )
      case 'inactive':
        return (
          <Badge variant='outline' className='border-gray-300 text-gray-600'>
            {users.status}
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant='outline' className='border-blue-300 text-blue-600'>
            {users.status}
          </Badge>
        )
      case 'on leave':
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-700 border-yellow-200'>
            {users.status}
          </Badge>
        )
      default:
        return (
          <Badge variant='outline' className='border-gray-300 text-gray-600'>
            Unknown
          </Badge>
        )
    }
  }

  const emptyStateMessage = () => {
    if (allUsersCount === 0) {
      return "No users have been added to the system yet. Click 'Add User' to get started."
    }
    if (users.length === 0 && allUsersCount > 0) {
      return 'No users found matching your current filters. Try adjusting or clearing the filters.'
    }
    return 'Something went wrong or no data to display.'
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
              <TableHead>Salary</TableHead>
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
                    <TableCell colSpan={8} className='py-6'>
                      <Skeleton className='h-6 w-full' />
                    </TableCell>
                  </TableRow>
                ))
            ) : (users.length === 0 || allUsersCount === 0) && !loading ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center py-10'>
                  {emptyStateMessage()}
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
                    {typeof user.baseSalary === 'number' ? formatRupiah(user.baseSalary) : '-'}
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
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
