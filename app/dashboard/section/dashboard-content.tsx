'use client'

import { Skeleton } from '@/components/atomics/skeleton'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent } from '@/components/molecules/card'
import {
  formatRupiah,
  getAttendanceRecords,
  getPayrollRecords,
  getProjects,
  getTasks,
  type Project,
  type Task,
} from '@/lib/helpers'
import { Briefcase, CheckSquare, Clock, DollarSign } from 'lucide-react'
import { useEffect, useState } from 'react'

// Import all dashboard widgets using standard pattern
import {
  AllTasksOverviewWidget,
  AttendanceWidget,
  MyTasksWidget,
  ProjectActivityWidget,
  QuickActionsWidget,
  RecentActivityWidget,
  SystemAnalyticsWidget,
  TeamManagementWidget,
} from '@/components/widgets'

export function DashboardContent() {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch tasks and projects based on user role
        if (userRole === 'admin') {
          const [tasksData, projectsData] = await Promise.all([
            getTasks(undefined, undefined, 'admin'),
            getProjects(undefined, 'admin'),
          ])
          setTasks(tasksData)
          setProjects(projectsData)

          // For admin, calculate total earnings across all users
          const payrollRecords = await getPayrollRecords(undefined, 'admin')
          const totalEarnings = payrollRecords.reduce(
            (sum, record) => sum + record.totalEarnings,
            0
          )
          setTotalEarnings(totalEarnings)
        } else {
          // For regular users, only fetch their assigned tasks and calculate their earnings
          if (user) {
            const [tasksData, projectsData, attendanceRecords, payrollRecords] = await Promise.all([
              getTasks(user.uid, undefined, 'employee'),
              getProjects(user.uid, 'employee'),
              getAttendanceRecords(user.uid, 'employee'),
              getPayrollRecords(user.uid, 'employee'),
            ])
            setTasks(tasksData)
            setProjects(projectsData)

            // Calculate total earnings from completed tasks (using taskRate instead of price)
            const taskEarnings = tasksData
              .filter(t => t.status === 'done')
              .reduce((sum, task) => sum + (task.taskRate || 0), 0)

            // Calculate total earnings from attendance
            const attendanceEarnings = attendanceRecords.reduce(
              (sum, record) => sum + (record.earnings || 0),
              0
            )

            // Calculate total earnings from payroll (if needed)
            const payrollEarnings = payrollRecords.reduce(
              (sum, record) => sum + (record.totalEarnings || 0),
              0
            )

            setTotalEarnings(taskEarnings + attendanceEarnings + payrollEarnings)
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Failed to load dashboard data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, userRole])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Welcome back, {displayName}!</h1>
        <p className='text-muted-foreground'>
          Here's an overview of your {userRole === 'admin' ? "team's" : 'personal'} activity
        </p>
      </div>

      {error && (
        <div className='rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive'>
          {error}
        </div>
      )}

      {/* Team Sync Dashboard Layout - Improved and decluttered */}
      {userRole === 'employee' ? (
        // Revamped Employee Dashboard Layout
        <div className='space-y-6'>
          {/* Row 1: Key Widgets */}
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <AttendanceWidget />
            <MyTasksWidget />
          </div>

          {/* Row 2: Secondary Widgets */}
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <ProjectActivityWidget />
            <QuickActionsWidget />
          </div>

          {/* Row 3: Activity Feed */}
          <div>
            <RecentActivityWidget />
          </div>
        </div>
      ) : (
        // Admin Dashboard Layout
        <div className='space-y-6'>
          {/* Top Row: Admin Summary Cards (4 metrics) */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 border-blue-200 dark:border-blue-800'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                      Active Today
                    </p>
                    <div className='text-2xl font-bold text-blue-700 dark:text-blue-300'>
                      {loading ? <Skeleton className='h-8 w-16' /> : '12'}
                    </div>
                  </div>
                  <Clock className='h-8 w-8 text-blue-500 dark:text-blue-400' />
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50 border-green-200 dark:border-green-800'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-green-600 dark:text-green-400'>
                      Projects
                    </p>
                    <div className='text-2xl font-bold text-green-700 dark:text-green-300'>
                      {loading ? <Skeleton className='h-8 w-16' /> : projects.length}
                    </div>
                  </div>
                  <Briefcase className='h-8 w-8 text-green-500 dark:text-green-400' />
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/50 border-purple-200 dark:border-purple-800'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-purple-600 dark:text-purple-400'>
                      Total Tasks
                    </p>
                    <div className='text-2xl font-bold text-purple-700 dark:text-purple-300'>
                      {loading ? <Skeleton className='h-8 w-16' /> : tasks.length}
                    </div>
                  </div>
                  <CheckSquare className='h-8 w-8 text-purple-500 dark:text-purple-400' />
                </div>
              </CardContent>
            </Card>

            <Card className='bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/50 border-orange-200 dark:border-orange-800'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-orange-600 dark:text-orange-400'>
                      Total Earnings
                    </p>
                    <div className='text-xl font-bold text-orange-700 dark:text-orange-300'>
                      {loading ? <Skeleton className='h-6 w-20' /> : formatRupiah(totalEarnings)}
                    </div>
                  </div>
                  <DollarSign className='h-8 w-8 text-orange-500 dark:text-orange-400' />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row: Project Activity + Attendance */}
          <div className='grid gap-6 md:grid-cols-2'>
            <ProjectActivityWidget />
            <AttendanceWidget />
          </div>

          {/* Third Row: Quick Actions + Team Management + All Tasks Overview */}
          <div className='grid gap-6 md:grid-cols-3'>
            <QuickActionsWidget />
            <TeamManagementWidget />
            <AllTasksOverviewWidget />
          </div>

          {/* Fourth Row: System Analytics + Recent Activity */}
          <div className='grid gap-6 md:grid-cols-2'>
            <SystemAnalyticsWidget />
            <RecentActivityWidget />
          </div>
        </div>
      )}
    </div>
  )
}
