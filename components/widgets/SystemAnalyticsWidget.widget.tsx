'use client'

import { Button } from '@/components/atomics/button'
import { Skeleton } from '@/components/atomics/skeleton'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { useProcessedEarnings } from '@/hooks'
import { getProjects, getTasks, getUsers } from '@/lib/database'
import { formatRupiah } from '@/lib/ui'
import type { Project, Task, UserData } from '@/types'
import { 
  BarChart3, 
  DollarSign, 
  MoreHorizontal, 
  TrendingUp, 
  Users, 
  Briefcase,
  CheckSquare,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface SystemAnalyticsWidgetProps {
  className?: string
}

interface SystemMetrics {
  totalUsers: number
  totalProjects: number
  totalTasks: number
  completionRate: number
  totalEarnings: number
  activeProjects: number
  pendingTasks: number
}

/**
 * System Analytics widget for admin dashboard
 * Shows key metrics and KPIs for the entire system
 */
export function SystemAnalyticsWidget({ className = '' }: SystemAnalyticsWidgetProps) {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalProjects: 0,
    totalTasks: 0,
    completionRate: 0,
    totalEarnings: 0,
    activeProjects: 0,
    pendingTasks: 0
  })

  // Get all user IDs for earnings calculation
  const [userIds, setUserIds] = useState<string[]>([])
  const earningsMap = useProcessedEarnings(userIds)

  const fetchSystemMetrics = useCallback(async () => {
    if (!user || userRole !== 'admin') return

    try {
      setLoading(true)
      
      // Fetch all system data
      const [usersData, projectsData, tasksData] = await Promise.all([
        getUsers(),
        getProjects(undefined, 'admin'),
        getTasks(undefined, undefined, 'admin')
      ])

      // Set user IDs for earnings calculation
      setUserIds(usersData.map(u => u.id))

      // Calculate metrics
      const completedTasks = tasksData.filter(t => t.status === 'done' || t.status === 'completed').length
      const activeProjects = projectsData.filter(p => p.status === 'in-progress').length
      const pendingTasks = tasksData.filter(t => 
        t.status === 'backlog' || t.status === 'in_progress' || t.status === 'in_review'
      ).length

      const systemMetrics: SystemMetrics = {
        totalUsers: usersData.length,
        totalProjects: projectsData.length,
        totalTasks: tasksData.length,
        completionRate: tasksData.length > 0 ? (completedTasks / tasksData.length) * 100 : 0,
        totalEarnings: 0, // Will be calculated from earnings map
        activeProjects,
        pendingTasks
      }

      setMetrics(systemMetrics)
    } catch (error) {
      console.error('Error fetching system metrics:', error)
    } finally {
      setLoading(false)
    }
  }, [user, userRole])

  // Calculate total earnings when earnings map updates
  useEffect(() => {
    if (earningsMap.size > 0) {
      const totalEarnings = Array.from(earningsMap.values())
        .reduce((sum, earnings) => sum + earnings.totalEarnings, 0)
      
      setMetrics(prev => ({ ...prev, totalEarnings }))
    }
  }, [earningsMap])

  useEffect(() => {
    fetchSystemMetrics()
  }, [fetchSystemMetrics])

  const getPerformanceIndicator = (rate: number) => {
    if (rate >= 80) return { color: 'text-green-600', label: 'Excellent', icon: <TrendingUp className='h-3 w-3' /> }
    if (rate >= 60) return { color: 'text-yellow-600', label: 'Good', icon: <BarChart3 className='h-3 w-3' /> }
    return { color: 'text-red-600', label: 'Needs Improvement', icon: <AlertTriangle className='h-3 w-3' /> }
  }

  if (userRole !== 'admin') {
    return null
  }

  const performance = getPerformanceIndicator(metrics.completionRate)

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <BarChart3 className='h-5 w-5' />
            System Analytics
          </CardTitle>
          <Link href='/reports'>
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
            <Skeleton className='h-8 w-full' />
            <div className='space-y-2'>
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className='h-6 w-full' />
              ))}
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Key Metrics Grid */}
            <div className='grid grid-cols-2 gap-2 text-center'>
              <div className='p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  <Users className='h-4 w-4 text-blue-600' />
                </div>
                <div className='text-lg font-bold text-blue-600'>{metrics.totalUsers}</div>
                <div className='text-xs text-blue-600'>Total Users</div>
              </div>
              
              <div className='p-2 bg-green-50 dark:bg-green-950/30 rounded-lg'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  <Briefcase className='h-4 w-4 text-green-600' />
                </div>
                <div className='text-lg font-bold text-green-600'>{metrics.activeProjects}</div>
                <div className='text-xs text-green-600'>Active Projects</div>
              </div>
              
              <div className='p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  <CheckSquare className='h-4 w-4 text-purple-600' />
                </div>
                <div className='text-lg font-bold text-purple-600'>{metrics.totalTasks}</div>
                <div className='text-xs text-purple-600'>Total Tasks</div>
              </div>
              
              <div className='p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  <DollarSign className='h-4 w-4 text-orange-600' />
                </div>
                <div className='text-sm font-bold text-orange-600'>
                  {formatRupiah(metrics.totalEarnings)}
                </div>
                <div className='text-xs text-orange-600'>Total Earnings</div>
              </div>
            </div>

            {/* Completion Rate */}
            <div className='p-3 bg-muted/50 rounded-lg'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>Task Completion Rate</span>
                <div className={`flex items-center gap-1 ${performance.color}`}>
                  {performance.icon}
                  <span className='text-xs'>{performance.label}</span>
                </div>
              </div>
              
              <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1'>
                <div 
                  className='bg-primary h-2 rounded-full transition-all duration-300'
                  style={{ width: `${Math.min(metrics.completionRate, 100)}%` }}
                />
              </div>
              
              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>{metrics.completionRate.toFixed(1)}% completed</span>
                <span>{metrics.pendingTasks} pending</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className='space-y-2'>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-muted-foreground'>Projects in Progress</span>
                <span className='font-medium'>{metrics.activeProjects}</span>
              </div>
              
              <div className='flex justify-between items-center text-sm'>
                <span className='text-muted-foreground'>Pending Tasks</span>
                <span className='font-medium'>{metrics.pendingTasks}</span>
              </div>
              
              <div className='flex justify-between items-center text-sm'>
                <span className='text-muted-foreground'>System Health</span>
                <span className={`font-medium ${performance.color}`}>
                  {performance.label}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
