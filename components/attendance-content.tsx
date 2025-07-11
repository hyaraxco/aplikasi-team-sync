'use client'

import { Button } from '@/components/atomics/button'
import { useAuth } from '@/components/auth-provider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/molecules/card'
import { useCallback, useEffect, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Skeleton } from '@/components/ui/skeleton'

import {
  getAttendanceRecords,
  getTodaysAttendance,
  checkIn as newCheckIn,
  checkOut as newCheckOut,
  type AttendanceRecord,
} from '@/lib/firestore'
import { format, getHours } from 'date-fns'
import { Clock, Info, LogIn, LogOut } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from './molecules/Alert.molecule'

export function AttendanceContent() {
  const { user, userRole } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [todaysAttendance, setTodaysAttendance] = useState<AttendanceRecord | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [canClockIn, setCanClockIn] = useState(false)
  const [canClockOut, setCanClockOut] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const updateDynamicStates = useCallback(() => {
    const now = currentTime

    let newStatusMessage = 'Checking attendance status...'
    let newCanClockIn = false
    let newCanClockOut = false

    const currentHour = getHours(now)

    if (todaysAttendance && todaysAttendance.checkIn) {
      if (!todaysAttendance.checkOut) {
        newStatusMessage = `You have already clocked in today at ${format(todaysAttendance.checkIn.toDate(), 'HH:mm')}. Waiting for clock-out.`
        if (currentHour >= 17) {
          newCanClockOut = true
        } else {
          newCanClockOut = false
          newStatusMessage += ' You can clock-out after 17:00.'
        }
      } else {
        const hoursWorked = todaysAttendance.hoursWorked?.toFixed(2) || 'N/A'
        newStatusMessage = `You have completed your attendance for today. Clocked out at ${format(todaysAttendance.checkOut.toDate(), 'HH:mm')}. Total hours worked: ${hoursWorked} hours.`
        newCanClockIn = false
        newCanClockOut = false
      }
    } else {
      newStatusMessage = "You haven't clocked in today yet."
      if (currentHour >= 8 && currentHour < 10) {
        newCanClockIn = true
      } else {
        newCanClockIn = false
        if (currentHour < 8) {
          newStatusMessage += ' You can clock-in starting from 08:00.'
        } else if (currentHour >= 10) {
          newStatusMessage += ' Clock-in time has ended (08:00 - 10:00).'
        }
      }
    }

    setStatusMessage(newStatusMessage)
    setCanClockIn(newCanClockIn && !actionLoading)
    setCanClockOut(newCanClockOut && !actionLoading)
  }, [todaysAttendance, actionLoading, currentTime])

  const fetchCurrentAttendanceState = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const record = await getTodaysAttendance(user.uid)
      setTodaysAttendance(record)
    } catch (err) {
      console.error("Error fetching today's attendance:", err)
      setError("Failed to load today's attendance status.")
      setTodaysAttendance(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user && userRole !== 'admin') {
      fetchCurrentAttendanceState()
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000 * 30)

    return () => clearInterval(timer)
  }, [user, userRole, fetchCurrentAttendanceState])

  useEffect(() => {
    if (userRole !== 'admin') {
      updateDynamicStates()
    }
  }, [todaysAttendance, currentTime, userRole, actionLoading, updateDynamicStates])

  const fetchAllAttendanceData = useCallback(async () => {
    if (!user) return
    if (userRole !== 'admin') {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const records = await getAttendanceRecords()
      setAllAttendanceRecords(records)
    } catch (error) {
      console.error('Error fetching all attendance data:', error)
      setError('Failed to load attendance data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [user, userRole])

  useEffect(() => {
    if (userRole === 'admin') {
      fetchAllAttendanceData()
    }
  }, [user, userRole, fetchAllAttendanceData])

  const handleCheckIn = async () => {
    if (!user || !canClockIn) return

    setError(null)
    setActionLoading(true)
    try {
      await newCheckIn(user.uid)
      await fetchCurrentAttendanceState()
    } catch (err: any) {
      console.error('Error checking in:', err)
      setError(err.message || 'Failed to clock-in. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!user || !todaysAttendance || !todaysAttendance.id || !canClockOut) return

    setError(null)
    setActionLoading(true)
    try {
      await newCheckOut(todaysAttendance.id, user.uid)
      await fetchCurrentAttendanceState()
    } catch (err: any) {
      console.error('Error checking out:', err)
      setError(err.message || 'Failed to clock-out. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && !todaysAttendance && userRole !== 'admin') {
    return (
      <div className='space-y-4'>
        <Card>
          <CardHeader>
            <Skeleton className='h-8 w-1/2' />
          </CardHeader>
          <CardContent className='space-y-2'>
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-10 w-1/4' />
          </CardContent>
        </Card>
      </div>
    )
  }

  const employeeAttendanceSection = userRole !== 'admin' && (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Clock className='mr-2 h-6 w-6' /> Today's Attendance
        </CardTitle>
        <CardDescription>Clock-in and clock-out according to schedule.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {error && (
          <Alert variant='destructive'>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {statusMessage && (
          <Alert variant={todaysAttendance?.checkOut ? 'success' : 'default'}>
            <Info className='h-4 w-4' />
            <AlertTitle>Status</AlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}
        <div className='flex space-x-4'>
          <Button
            onClick={handleCheckIn}
            disabled={!canClockIn || actionLoading}
            className='flex-1'
            variant={canClockIn ? 'default' : 'secondary'}
          >
            <LogIn className='mr-2 h-5 w-5' />
            {actionLoading && !canClockOut ? 'Processing...' : 'Clock In'}
          </Button>
          <Button
            onClick={handleCheckOut}
            disabled={!canClockOut || actionLoading}
            className='flex-1'
            variant={canClockOut ? 'destructive' : 'secondary'}
          >
            <LogOut className='mr-2 h-5 w-5' />
            {actionLoading && canClockOut ? 'Processing...' : 'Clock Out'}
          </Button>
        </div>
        <p className='text-sm text-muted-foreground text-center'>
          Current Server Time: {format(currentTime, 'HH:mm:ss')}
        </p>
      </CardContent>
    </Card>
  )

  return (
    <div className='space-y-6 p-4 md:p-6'>
      <h1 className='text-3xl font-bold tracking-tight'>Attendance</h1>

      {employeeAttendanceSection}

      <Tabs defaultValue='my_records' className='space-y-4'>
        <TabsList>
          {userRole === 'admin' && <TabsTrigger value='all_records'>All Employees</TabsTrigger>}
          <TabsTrigger value='my_records'>My Attendance (This Month)</TabsTrigger>
        </TabsList>

        {userRole === 'admin' && (
          <TabsContent value='all_records' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>All Employees Attendance List</CardTitle>
                <CardDescription>View attendance records from all employees.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading && <p>Loading admin attendance data...</p>}
                {!loading && allAttendanceRecords.length === 0 && (
                  <p>No attendance data available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value='my_records' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>My Attendance History</CardTitle>
              <CardDescription>Your attendance records for this month.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Employee attendance history section will be implemented.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
