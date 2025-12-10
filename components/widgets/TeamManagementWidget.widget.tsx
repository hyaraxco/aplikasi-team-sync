'use client'

import { Badge } from '@/components/atomics/badge'
import { Button } from '@/components/atomics/button'
import { Skeleton } from '@/components/atomics/skeleton'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { EmptyState } from '@/components/molecules/data-display'
import { getAttendanceRecords, getUsers } from '@/lib/database'
import type { AttendanceRecord, UserData } from '@/types'
import { format, isToday, startOfDay } from 'date-fns'
import { 
  Clock, 
  MoreHorizontal, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  UserCheck,
  UserX
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface TeamManagementWidgetProps {
  className?: string
}

interface TeamStats {
  totalEmployees: number
  activeToday: number
  onLeave: number
  avgHoursWorked: number
}

/**
 * Team Management widget for admin dashboard
 * Shows team performance and attendance overview
 */
export function TeamManagementWidget({ className = '' }: TeamManagementWidgetProps) {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalEmployees: 0,
    activeToday: 0,
    onLeave: 0,
    avgHoursWorked: 0
  })
  const [recentAttendance, setRecentAttendance] = useState<(AttendanceRecord & { userName: string })[]>([])

  const fetchTeamData = useCallback(async () => {
    if (!user || userRole !== 'admin') return

    try {
      setLoading(true)
      
      // Fetch all users and attendance records
      const [usersData, attendanceData] = await Promise.all([
        getUsers(),
        getAttendanceRecords(undefined, 'admin')
      ])

      // Filter employees only
      const employees = usersData.filter(u => u.role === 'employee')
      
      // Get today's attendance
      const todayAttendance = attendanceData.filter(record => 
        record.checkIn && isToday(record.checkIn.toDate())
      )

      // Calculate stats
      const stats: TeamStats = {
        totalEmployees: employees.length,
        activeToday: todayAttendance.length,
        onLeave: employees.filter(u => u.status === 'on leave').length,
        avgHoursWorked: todayAttendance.length > 0 
          ? todayAttendance.reduce((sum, record) => sum + (record.hoursWorked || 0), 0) / todayAttendance.length
          : 0
      }
      setTeamStats(stats)

      // Get recent attendance with user names (last 5 records)
      const recentWithNames = attendanceData
        .slice(0, 5)
        .map(record => {
          const user = usersData.find(u => u.id === record.userId)
          return {
            ...record,
            userName: user?.name || user?.email || 'Unknown User'
          }
        })
      setRecentAttendance(recentWithNames)

    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, userRole])

  useEffect(() => {
    fetchTeamData()
  }, [fetchTeamData])

  const getAttendanceStatus = (record: AttendanceRecord) => {
    if (record.checkOut) {
      const hoursWorked = record.hoursWorked || 0
      if (hoursWorked >= 8) {
        return { status: 'completed', color: 'text-green-600', icon: <UserCheck className='h-3 w-3' /> }
      } else {
        return { status: 'partial', color: 'text-yellow-600', icon: <Clock className='h-3 w-3' /> }
      }
    } else if (record.checkIn) {
      return { status: 'active', color: 'text-blue-600', icon: <Clock className='h-3 w-3' /> }
    }
    return { status: 'absent', color: 'text-gray-500', icon: <UserX className='h-3 w-3' /> }
  }

  if (userRole !== 'admin') {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Users className='h-5 w-5' />
            Team Management
          </CardTitle>
          <Link href='/users'>
            <Button variant='ghost' size='sm'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-2'>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
            <div className='space-y-2'>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className='h-8 w-full' />
              ))}
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Team Statistics */}
            <div className='grid grid-cols-2 gap-2 text-center'>
              <div className='p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg'>
                <div className='text-lg font-bold text-blue-600'>{teamStats.activeToday}</div>
                <div className='text-xs text-blue-600'>Active Today</div>
              </div>
              <div className='p-2 bg-green-50 dark:bg-green-950/30 rounded-lg'>
                <div className='text-lg font-bold text-green-600'>{teamStats.totalEmployees}</div>
                <div className='text-xs text-green-600'>Total Team</div>
              </div>
              <div className='p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg'>
                <div className='text-lg font-bold text-yellow-600'>{teamStats.onLeave}</div>
                <div className='text-xs text-yellow-600'>On Leave</div>
              </div>
              <div className='p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg'>
                <div className='text-lg font-bold text-purple-600'>
                  {teamStats.avgHoursWorked.toFixed(1)}h
                </div>
                <div className='text-xs text-purple-600'>Avg Hours</div>
              </div>
            </div>

            {/* Performance Indicator */}
            <div className='flex items-center justify-between p-2 bg-muted/50 rounded-lg'>
              <span className='text-sm font-medium'>Team Performance</span>
              <div className='flex items-center gap-1'>
                {teamStats.activeToday / teamStats.totalEmployees >= 0.8 ? (
                  <>
                    <TrendingUp className='h-4 w-4 text-green-600' />
                    <span className='text-sm text-green-600'>Excellent</span>
                  </>
                ) : teamStats.activeToday / teamStats.totalEmployees >= 0.6 ? (
                  <>
                    <Clock className='h-4 w-4 text-yellow-600' />
                    <span className='text-sm text-yellow-600'>Good</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className='h-4 w-4 text-red-600' />
                    <span className='text-sm text-red-600'>Needs Attention</span>
                  </>
                )}
              </div>
            </div>

            {/* Recent Attendance */}
            <div>
              <h4 className='text-sm font-medium mb-2'>Recent Activity</h4>
              
              {recentAttendance.length === 0 ? (
                <EmptyState
                  icon={<Clock className='h-6 w-6 text-muted-foreground' />}
                  title='No recent activity'
                  description='No attendance records found.'
                />
              ) : (
                <div className='space-y-2'>
                  {recentAttendance.map((record) => {
                    const attendanceStatus = getAttendanceStatus(record)
                    return (
                      <div
                        key={record.id}
                        className='flex items-center justify-between p-2 border rounded-lg'
                      >
                        <div className='flex items-center gap-2'>
                          <div className={attendanceStatus.color}>
                            {attendanceStatus.icon}
                          </div>
                          <div>
                            <div className='text-sm font-medium'>{record.userName}</div>
                            <div className='text-xs text-muted-foreground'>
                              {record.checkIn && format(record.checkIn.toDate(), 'MMM dd, HH:mm')}
                            </div>
                          </div>
                        </div>
                        
                        <div className='text-right'>
                          {record.hoursWorked && (
                            <div className='text-xs font-medium'>
                              {record.hoursWorked.toFixed(1)}h
                            </div>
                          )}
                          <Badge 
                            variant={attendanceStatus.status === 'completed' ? 'default' : 'secondary'}
                            className='text-xs'
                          >
                            {attendanceStatus.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
