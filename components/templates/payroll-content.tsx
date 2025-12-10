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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/molecules/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/molecules/tabs'
import { useEffect, useState } from 'react'

import { Skeleton } from '@/components/atomics/skeleton'

import { Alert, AlertDescription } from '@/components/atomics/alert'
import { Badge } from '@/components/atomics/badge'
import { MonthPicker } from '@/components/molecules/AntDatePicker'
import { getAttendanceRecords, getPayrollRecords, getTasks } from '@/lib/database'
import { db } from '@/lib/firebase'
import { formatRupiah } from '@/lib/ui'
import type { AttendanceRecord, Payroll, Task, UserData } from '@/types'
import { format } from 'date-fns'
import { collection, getDocs } from 'firebase/firestore'
import { Download, FileText } from 'lucide-react'

export function PayrollContent() {
  const { user, userRole } = useAuth()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [period, setPeriod] = useState(format(new Date(), 'MMMM-yyyy').toLowerCase())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [users, setUsers] = useState<Record<string, UserData>>({})

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch payroll records, completed tasks, and attendance records
        if (userRole === 'admin') {
          const [payrollData, usersSnapshot] = await Promise.all([
            getPayrollRecords(),
            getDocs(collection(db, 'users')),
          ])

          setPayrollRecords(payrollData)

          // Create a map of user data
          const usersMap: Record<string, UserData> = {}
          usersSnapshot.docs.forEach(doc => {
            usersMap[doc.id] = { id: doc.id, ...doc.data() } as UserData
          })
          setUsers(usersMap)
        } else {
          const [payrollData, tasksData, attendanceData] = await Promise.all([
            getPayrollRecords(user.uid),
            getTasks(user.uid),
            getAttendanceRecords(user.uid),
          ])

          setPayrollRecords(payrollData)
          setCompletedTasks(tasksData.filter(task => task.status === 'completed'))
          setAttendanceRecords(attendanceData)
        }
      } catch (error) {
        console.error('Error fetching payroll data:', error)
        setError('Failed to load payroll data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, userRole])

  // Update period when date changes
  useEffect(() => {
    if (date) {
      setPeriod(format(date, 'MMMM-yyyy').toLowerCase())
    }
  }, [date])

  // Filter records based on selected date
  const getFilteredRecords = (): Payroll[] => {
    if (!date) return payrollRecords

    const selectedMonth = date.getMonth()
    const selectedYear = date.getFullYear()

    return payrollRecords.filter(record => {
      // Check if period matches the selected month/year
      return record.period.toLowerCase() === period
    })
  }

  // Calculate total earnings from completed tasks
  const taskEarnings = completedTasks.reduce((sum, task) => sum + (task.taskRate || 0), 0)

  // Calculate total earnings from attendance
  const attendanceEarnings = attendanceRecords.reduce(
    (sum, record) => sum + (record.earnings || 0),
    0
  )

  // Calculate total earnings
  const totalEarnings = taskEarnings + attendanceEarnings

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  // Filter tasks and attendance records for the selected month
  const filteredTasks = completedTasks.filter(task => {
    if (!date || !task.completedAt) return false
    const completedDate = task.completedAt.toDate()
    return (
      completedDate.getMonth() === date.getMonth() &&
      completedDate.getFullYear() === date.getFullYear()
    )
  })

  const filteredAttendance = attendanceRecords.filter(record => {
    if (!date) return false
    const recordDate = record.date.toDate()
    return (
      recordDate.getMonth() === date.getMonth() && recordDate.getFullYear() === date.getFullYear()
    )
  })

  const filteredPayroll = getFilteredRecords()

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Payroll</h1>
          <p className='text-muted-foreground'>
            {userRole === 'admin' ? 'Manage team payroll' : 'View your earnings'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <MonthPicker
            value={date}
            onChange={date => setDate(date || undefined)}
            placeholder='Pick a month'
            className='w-[200px]'
          />
          {userRole === 'admin' && (
            <Button>
              <Download className='mr-2 h-4 w-4' />
              Export
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {userRole === 'admin' ? (
        <Card>
          <CardHeader>
            <CardTitle>Team Payroll</CardTitle>
            <CardDescription>Payroll summary for all team members</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='space-y-2'>
                <Skeleton className='h-10 w-full' />
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className='h-16 w-full' />
                  ))}
              </div>
            ) : filteredPayroll.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Task Earnings</TableHead>
                    <TableHead>Attendance Earnings</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayroll.map(record => {
                    const userData = users[record.userId]
                    const displayName = userData
                      ? userData.displayName || userData.email
                      : record.userId

                    return (
                      <TableRow key={record.id}>
                        <TableCell className='font-medium'>{displayName}</TableCell>
                        <TableCell>{record.period}</TableCell>
                        <TableCell>{formatRupiah(record.taskEarnings)}</TableCell>
                        <TableCell>{formatRupiah(record.attendanceEarnings)}</TableCell>
                        <TableCell className='font-medium'>
                          {formatRupiah(record.totalEarnings)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button variant='ghost' size='sm'>
                            <FileText className='mr-2 h-4 w-4' />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className='py-6 text-center text-muted-foreground'>
                No payroll records found for this period
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Earnings Summary</CardTitle>
              <CardDescription>
                Your earnings for {format(date || new Date(), 'MMMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='grid gap-4 md:grid-cols-3'>
                  <Skeleton className='h-20 w-full' />
                  <Skeleton className='h-20 w-full' />
                  <Skeleton className='h-20 w-full' />
                </div>
              ) : (
                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>Task Earnings</p>
                    <p className='text-2xl font-bold'>
                      {formatRupiah(
                        filteredTasks.reduce((sum, task) => sum + (task.taskRate || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>Attendance Earnings</p>
                    <p className='text-2xl font-bold'>
                      {formatRupiah(
                        filteredAttendance.reduce((sum, record) => sum + (record.earnings || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>Total Earnings</p>
                    <p className='text-2xl font-bold'>
                      $
                      {(
                        filteredTasks.reduce((sum, task) => sum + (task.taskRate || 0), 0) +
                        filteredAttendance.reduce((sum, record) => sum + (record.earnings || 0), 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue='tasks'>
            <TabsList className='mb-4'>
              <TabsTrigger value='tasks'>Task Earnings</TabsTrigger>
              <TabsTrigger value='attendance'>Attendance Earnings</TabsTrigger>
            </TabsList>
            <TabsContent value='tasks'>
              <Card>
                <CardHeader>
                  <CardTitle>Completed Tasks</CardTitle>
                  <CardDescription>Tasks you've completed and their earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className='space-y-2'>
                      <Skeleton className='h-10 w-full' />
                      {Array(4)
                        .fill(0)
                        .map((_, i) => (
                          <Skeleton key={i} className='h-16 w-full' />
                        ))}
                    </div>
                  ) : filteredTasks.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Completed Date</TableHead>
                          <TableHead>Earnings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.map(task => (
                          <TableRow key={task.id}>
                            <TableCell className='font-medium'>{task.name}</TableCell>
                            <TableCell>{task.projectId}</TableCell>
                            <TableCell>
                              {task.completedAt
                                ? task.completedAt.toDate().toLocaleDateString()
                                : 'N/A'}
                            </TableCell>
                            <TableCell>{formatRupiah(task.taskRate || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className='py-6 text-center text-muted-foreground'>
                      No completed tasks found for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value='attendance'>
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Logs</CardTitle>
                  <CardDescription>Your attendance records and earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className='space-y-2'>
                      <Skeleton className='h-10 w-full' />
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Skeleton key={i} className='h-16 w-full' />
                        ))}
                    </div>
                  ) : filteredAttendance.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Check In</TableHead>
                          <TableHead>Check Out</TableHead>
                          <TableHead>Hours Worked</TableHead>
                          <TableHead>Hourly Rate</TableHead>
                          <TableHead>Earnings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAttendance.map(record => (
                          <TableRow key={record.id}>
                            <TableCell>{record.date.toDate().toLocaleDateString()}</TableCell>
                            <TableCell>{format(record.checkIn.toDate(), 'hh:mm a')}</TableCell>
                            <TableCell>
                              {record.checkOut
                                ? format(record.checkOut.toDate(), 'hh:mm a')
                                : 'Not checked out'}
                            </TableCell>
                            <TableCell>{record.hoursWorked?.toFixed(2) || 'N/A'}</TableCell>
                            <TableCell>{formatRupiah((record as any).hourlyRate || 0)}</TableCell>
                            <TableCell>{formatRupiah((record as any).earnings || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className='py-6 text-center text-muted-foreground'>
                      No attendance records found for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
