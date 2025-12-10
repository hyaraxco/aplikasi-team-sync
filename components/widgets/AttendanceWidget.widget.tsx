'use client'

import { Button } from '@/components/atomics/button'
import { Skeleton } from '@/components/atomics/skeleton'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { getTodaysAttendance, checkIn as newCheckIn, checkOut as newCheckOut } from '@/lib/database'
import type { AttendanceRecord } from '@/types'
import { format, getHours } from 'date-fns'
import { Clock, LogIn, LogOut, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '../atomics/alert'

interface AttendanceWidgetProps {
  className?: string
}

/**
 * Compact attendance widget for dashboard
 * Allows quick check-in/check-out with status display
 */
export function AttendanceWidget({ className = '' }: AttendanceWidgetProps) {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [todaysAttendance, setTodaysAttendance] = useState<AttendanceRecord | null>(null)
  const [canClockIn, setCanClockIn] = useState(false)
  const [canClockOut, setCanClockOut] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchCurrentAttendanceState = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const attendance = await getTodaysAttendance(user.uid)
      setTodaysAttendance(attendance)

      // Determine current state and actions
      const currentHour = getHours(new Date())
      let newCanClockIn = false
      let newCanClockOut = false
      let newStatusMessage = ''

      if (!attendance || !attendance.checkIn) {
        // User hasn't clocked in today
        if (currentHour >= 8 && currentHour <= 10) {
          newCanClockIn = true
          newStatusMessage = 'Ready to clock in! (8:00 - 10:00)'
        } else if (currentHour < 8) {
          newStatusMessage = 'Clock-in available from 8:00 AM'
        } else {
          newStatusMessage = 'Clock-in window closed (8:00 - 10:00)'
        }
      } else if (attendance.checkIn && !attendance.checkOut) {
        // User has clocked in but not out
        const clockInTime = format(attendance.checkIn.toDate(), 'HH:mm')
        newStatusMessage = `Clocked in at ${clockInTime}`

        if (currentHour >= 17) {
          newCanClockOut = true
          newStatusMessage += ' - Ready to clock out!'
        } else {
          newStatusMessage += ' - Clock out available after 17:00'
        }
      } else {
        // User has completed attendance for today
        const clockOutTime = format(attendance.checkOut!.toDate(), 'HH:mm')
        const hoursWorked = attendance.hoursWorked?.toFixed(1) || 'N/A'
        newStatusMessage = `Completed! Out at ${clockOutTime} (${hoursWorked}h)`
      }

      setCanClockIn(newCanClockIn)
      setCanClockOut(newCanClockOut)
      setStatusMessage(newStatusMessage)
    } catch (err: any) {
      console.error('Error fetching attendance state:', err)
      setError('Failed to load attendance status')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCurrentAttendanceState()
  }, [fetchCurrentAttendanceState])

  const handleCheckIn = async () => {
    if (!user || !canClockIn) return

    setError(null)
    setActionLoading(true)
    try {
      await newCheckIn(user.uid)
      await fetchCurrentAttendanceState()
    } catch (err: any) {
      console.error('Error checking in:', err)
      setError(err.message || 'Failed to clock in')
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
      setError(err.message || 'Failed to clock out')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusVariant = () => {
    if (todaysAttendance?.checkOut) return 'default' // Completed
    if (todaysAttendance?.checkIn) return 'secondary' // Checked in
    return 'outline' // Not started
  }

  const getStatusIcon = () => {
    if (todaysAttendance?.checkOut) return <TrendingUp className='h-4 w-4' />
    if (todaysAttendance?.checkIn) return <Clock className='h-4 w-4' />
    return <Clock className='h-4 w-4' />
  }

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Clock className='h-5 w-5' />
          Today's Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {loading ? (
          <div className='space-y-3'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-8 w-full' />
          </div>
        ) : (
          <>
            {error && (
              <Alert variant='destructive' className='py-2'>
                <AlertTitle className='text-sm'>Error</AlertTitle>
                <AlertDescription className='text-xs'>{error}</AlertDescription>
              </Alert>
            )}

            {/* Status Display */}
            <div className='text-center space-y-2'>
              <div className='flex items-center justify-center gap-2'>
                {getStatusIcon()}
                <span className='text-sm font-medium'>{statusMessage}</span>
              </div>
              <div className='text-xs text-muted-foreground'>
                Current time: {format(currentTime, 'HH:mm:ss')}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2'>
              <Button
                onClick={handleCheckIn}
                disabled={!canClockIn || actionLoading}
                className='flex-1'
                size='sm'
                variant={canClockIn ? 'default' : 'secondary'}
              >
                <LogIn className='mr-1 h-4 w-4' />
                {actionLoading && canClockIn ? 'Processing...' : 'Clock In'}
              </Button>
              <Button
                onClick={handleCheckOut}
                disabled={!canClockOut || actionLoading}
                className='flex-1'
                size='sm'
                variant={canClockOut ? 'destructive' : 'secondary'}
              >
                <LogOut className='mr-1 h-4 w-4' />
                {actionLoading && canClockOut ? 'Processing...' : 'Clock Out'}
              </Button>
            </div>

            {/* Hours Worked Display */}
            {todaysAttendance?.hoursWorked && (
              <div className='text-center pt-2 border-t'>
                <div className='text-xs text-muted-foreground'>Hours Worked Today</div>
                <div className='text-lg font-semibold'>
                  {todaysAttendance.hoursWorked.toFixed(1)}h
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
