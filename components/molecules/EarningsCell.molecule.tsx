'use client'

import { Skeleton } from '@/components/atomics/skeleton'
import { formatRupiah } from '@/lib/ui'
import { Info } from 'lucide-react'
import { useState } from 'react'

interface EarningsCellProps {
  taskEarnings: number
  attendanceEarnings: number
  totalEarnings: number
  taskCount: number
  attendanceCount: number
  loading: boolean
  error: string | null
  userRole: string
}

/**
 * EarningsCell component with tooltip breakdown
 * Shows total earnings with expandable breakdown for task and attendance earnings
 */
export function EarningsCell({
  taskEarnings,
  attendanceEarnings,
  totalEarnings,
  taskCount,
  attendanceCount,
  loading,
  error,
  userRole,
}: EarningsCellProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Admin users now participate in earnings system (removed N/A display)

  // Loading state
  if (loading) {
    return <Skeleton className='h-6 w-20' />
  }

  // Error state
  if (error) {
    return (
      <div className='flex items-center gap-2 text-red-500'>
        <span className='text-sm'>Error</span>
        <Info className='h-3 w-3' title={error} />
      </div>
    )
  }

  return (
    <div className='relative'>
      <div
        className='flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors'
        onClick={() => setShowBreakdown(!showBreakdown)}
        title='Click to see earnings breakdown'
      >
        <span className='font-medium text-sm'>{formatRupiah(totalEarnings)}</span>
        <Info className='h-3 w-3 text-muted-foreground' />
      </div>

      {/* Breakdown Tooltip */}
      {showBreakdown && (
        <div className='absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg p-3 min-w-[200px]'>
          <div className='space-y-2 text-xs'>
            <div className='font-medium text-foreground border-b border-border pb-1'>
              Earnings Breakdown
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>Task Completion:</span>
              <div className='text-right'>
                <div className='font-medium'>{formatRupiah(taskEarnings)}</div>
                <div className='text-xs text-muted-foreground'>
                  {taskCount} task{taskCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>Attendance:</span>
              <div className='text-right'>
                <div className='font-medium'>{formatRupiah(attendanceEarnings)}</div>
                <div className='text-xs text-muted-foreground'>
                  {attendanceCount} day{attendanceCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className='border-t border-border pt-1 flex justify-between items-center font-medium'>
              <span>Total:</span>
              <span>{formatRupiah(totalEarnings)}</span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={e => {
              e.stopPropagation()
              setShowBreakdown(false)
            }}
            className='absolute top-1 right-1 text-muted-foreground hover:text-foreground'
            title='Close'
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Simple earnings display without breakdown (for compact views)
 */
export function SimpleEarningsCell({
  totalEarnings,
  loading,
  error,
  userRole,
}: {
  totalEarnings: number
  loading: boolean
  error: string | null
  userRole: string
}) {
  // Admin users now participate in earnings system (removed N/A display)

  // Loading state
  if (loading) {
    return <Skeleton className='h-4 w-16' />
  }

  // Error state
  if (error) {
    return <span className='text-sm text-red-500'>Error</span>
  }

  return <span className='text-sm font-medium'>{formatRupiah(totalEarnings)}</span>
}
