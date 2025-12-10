'use client'

import { useAuth } from '@/components/auth-provider'
import { subscribeAllEarnings, subscribeEarningsByUserId } from '@/lib/database'
import type { Earning } from '@/types'
import { useEffect, useState } from 'react'

export interface UserEarningsData {
  taskEarnings: number
  attendanceEarnings: number
  totalEarnings: number
  taskCount: number
  attendanceCount: number
  loading: boolean
  error: string | null
}

/**
 * Hook to subscribe to real-time earnings updates.
 * Admins see all earnings, employees see only their own.
 */
export function useEarnings(): Earning[] {
  const { user, userRole } = useAuth()
  const [earnings, setEarnings] = useState<Earning[]>([])

  useEffect(() => {
    if (!user) return
    const unsubscribe =
      userRole === 'admin'
        ? subscribeAllEarnings(setEarnings)
        : subscribeEarningsByUserId(user.uid, setEarnings)
    return () => unsubscribe()
  }, [user, userRole])

  return earnings
}

/**
 * Enhanced hook that processes raw earnings data into user-friendly format
 * Provides real-time updates with aggregated calculations
 */
export function useProcessedEarnings(userIds?: string[]): Map<string, UserEarningsData> {
  const rawEarnings = useEarnings()
  const [processedEarnings, setProcessedEarnings] = useState<Map<string, UserEarningsData>>(
    new Map()
  )

  // Convert userIds array to stable string for dependency comparison
  const userIdsString = userIds ? JSON.stringify([...userIds].sort()) : null

  useEffect(() => {
    const newMap = new Map<string, UserEarningsData>()

    // If specific user IDs are provided, filter for those users
    const relevantUserIds = userIds || [...new Set(rawEarnings.map(e => e.userId))]

    relevantUserIds.forEach(userId => {
      const userEarnings = rawEarnings.filter(e => e.userId === userId)

      const taskEarnings = userEarnings
        .filter(e => e.type === 'task')
        .reduce((sum, e) => sum + e.amount, 0)

      const attendanceEarnings = userEarnings
        .filter(e => e.type === 'attendance')
        .reduce((sum, e) => sum + e.amount, 0)

      const taskCount = userEarnings.filter(e => e.type === 'task').length
      const attendanceCount = userEarnings.filter(e => e.type === 'attendance').length

      newMap.set(userId, {
        taskEarnings,
        attendanceEarnings,
        totalEarnings: taskEarnings + attendanceEarnings,
        taskCount,
        attendanceCount,
        loading: false,
        error: null,
      })
    })

    setProcessedEarnings(newMap)
  }, [rawEarnings, userIdsString]) // Use string instead of array for stable comparison

  return processedEarnings
}

/**
 * Hook for single user earnings with real-time updates
 */
export function useSingleUserEarnings(userId?: string): UserEarningsData {
  const processedEarnings = useProcessedEarnings(userId ? [userId] : undefined)

  return userId
    ? processedEarnings.get(userId) || {
        taskEarnings: 0,
        attendanceEarnings: 0,
        totalEarnings: 0,
        taskCount: 0,
        attendanceCount: 0,
        loading: false,
        error: null,
      }
    : {
        taskEarnings: 0,
        attendanceEarnings: 0,
        totalEarnings: 0,
        taskCount: 0,
        attendanceCount: 0,
        loading: false,
        error: null,
      }
}
