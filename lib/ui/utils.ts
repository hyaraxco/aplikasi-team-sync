import type { BadgeConfig, CurrencyFormatOptions, DateLike } from '@/types'
import { isFirestoreTimestamp, isValidDate } from '@/types'
import type { ProjectPriority, ProjectStatus, TaskPriority, TaskStatus } from '@/types/database'
import { type ClassValue, clsx } from 'clsx'
import { AlertCircle, CheckCircle2, Clock, PauseCircle } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for merging Tailwind CSS classes
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date-like value into a localized date string with proper type safety
 *
 * @param timestamp - Date, Firestore Timestamp, string, or number to format
 * @param options - Formatting options
 * @returns Formatted date string or fallback message
 *
 * @example
 * ```typescript
 * formatDate(new Date()) // "12/25/2023"
 * formatDate(firestoreTimestamp) // "12/25/2023"
 * formatDate(null) // "Not set"
 * formatDate("invalid") // "Invalid date"
 * ```
 */
export function formatDate(
  timestamp: DateLike | null | undefined,
  options: Intl.DateTimeFormatOptions & { fallback?: string } = {}
): string {
  const { fallback = 'Not set', ...formatOptions } = options

  if (!timestamp) return fallback

  try {
    let date: Date

    // Handle Firestore Timestamp
    if (isFirestoreTimestamp(timestamp)) {
      date = timestamp.toDate()
    }
    // Handle Date objects
    else if (isValidDate(timestamp)) {
      date = timestamp
    }
    // Handle string/number dates
    else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp)
      if (!isValidDate(date)) {
        throw new Error('Invalid date string/number')
      }
    }
    // Unknown type
    else {
      throw new Error('Unsupported timestamp type')
    }

    return date.toLocaleDateString(undefined, formatOptions)
  } catch (error) {
    console.error('Error formatting date:', error, { timestamp })
    return 'Invalid date'
  }
}

/**
 * Gets badge configuration for project status with type safety
 *
 * @param status - Project status enum value
 * @returns Badge configuration with color and icon
 *
 * @example
 * ```typescript
 * const { color, Icon } = getStatusBadge(ProjectStatus.InProgress);
 * ```
 */
export const getStatusBadge = (status: ProjectStatus): BadgeConfig & { hexColor: string } => {
  const statusConfig: Record<ProjectStatus, BadgeConfig & { hexColor: string }> = {
    planning: {
      color: 'bg-blue-500',
      hexColor: '#3b82f6',
      Icon: Clock,
    },
    'in-progress': {
      color: 'bg-yellow-500',
      hexColor: '#eab308',
      Icon: AlertCircle,
    },
    completed: {
      color: 'bg-green-500',
      hexColor: '#22c55e',
      Icon: CheckCircle2,
    },
    'on-hold': {
      color: 'bg-gray-500',
      hexColor: '#6b7280',
      Icon: PauseCircle,
    },
  }

  return statusConfig[status] || { color: 'bg-gray-500', hexColor: '#6b7280' }
}

/**
 * Gets badge configuration for project priority with type safety
 *
 * @param priority - Project priority enum value
 * @returns Badge configuration with color
 *
 * @example
 * ```typescript
 * const { color } = getPriorityBadge(ProjectPriority.High);
 * ```
 */
export const getPriorityBadge = (priority: ProjectPriority): BadgeConfig & { hexColor: string } => {
  const priorityConfig: Record<ProjectPriority, BadgeConfig & { hexColor: string }> = {
    low: {
      color: 'bg-blue-500',
      hexColor: '#3b82f6',
    },
    medium: {
      color: 'bg-yellow-500',
      hexColor: '#eab308',
    },
    high: {
      color: 'bg-red-500',
      hexColor: '#ef4444',
    },
  }

  return priorityConfig[priority] || { color: 'bg-gray-500', hexColor: '#6b7280' }
}

/**
 * Gets badge configuration for task status with type safety
 *
 * @param status - Task status enum value
 * @returns Badge configuration with color and hex color
 *
 * @example
 * ```typescript
 * const { color, hexColor } = getTaskStatusBadge("in_progress");
 * ```
 */
export const getTaskStatusBadge = (
  status: TaskStatus | 'rejected'
): BadgeConfig & { hexColor: string } => {
  const statusConfig: Record<TaskStatus | 'rejected', BadgeConfig & { hexColor: string }> = {
    backlog: {
      color: 'bg-slate-500',
      hexColor: '#64748b',
    },
    in_progress: {
      color: 'bg-blue-600',
      hexColor: '#2563eb',
    },
    completed: {
      color: 'bg-amber-500',
      hexColor: '#f59e0b',
    },
    revision: {
      color: 'bg-orange-500',
      hexColor: '#f97316',
    },
    done: {
      color: 'bg-emerald-600',
      hexColor: '#059669',
    },
    rejected: {
      color: 'bg-red-600',
      hexColor: '#dc2626',
    },
    blocked: {
      color: 'bg-rose-600',
      hexColor: '#e11d48',
    },
  }

  return statusConfig[status] || { color: 'bg-gray-500', hexColor: '#6b7280' }
}

/**
 * Gets comprehensive task status badge configuration with text and styling
 * Provides consistent badge appearance across all components
 *
 * @param status - Task status
 * @param userRole - User role for appropriate text display
 * @returns Complete badge configuration with colors, text, and styling
 */
export const getTaskStatusBadgeConfig = (
  status: TaskStatus | 'rejected',
  userRole: 'admin' | 'employee' = 'employee'
) => {
  const baseConfig = getTaskStatusBadge(status)

  const statusTextConfig: Record<TaskStatus | 'rejected', { admin: string; employee: string }> = {
    backlog: { admin: 'Backlog', employee: 'To Do' },
    in_progress: { admin: 'In Progress', employee: 'In Progress' },
    completed: { admin: 'Pending Approval', employee: 'In Review' },
    revision: { admin: 'Needs Revision', employee: 'Needs Revision' },
    done: { admin: 'Approved', employee: 'Approved' },
    rejected: { admin: 'Rejected', employee: 'Revision' },
    blocked: { admin: 'Blocked', employee: 'Blocked' },
  }

  const text = statusTextConfig[status]?.[userRole] || status

  // Consistent styling classes
  const baseClasses = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium'

  // Color-specific classes for consistent styling
  const colorClasses: Record<string, string> = {
    '#64748b': 'bg-slate-100 text-slate-800', // backlog
    '#2563eb': 'bg-blue-100 text-blue-700', // in_progress
    '#f59e0b': 'bg-yellow-100 text-yellow-800', // completed
    '#f97316': 'bg-orange-100 text-orange-700', // revision
    '#059669': 'bg-green-100 text-green-700', // done
    '#dc2626': 'bg-red-100 text-red-700', // rejected
    '#e11d48': 'bg-rose-100 text-rose-700', // blocked
  }

  const colorClass = colorClasses[baseConfig.hexColor] || 'bg-gray-100 text-gray-700'

  return {
    ...baseConfig,
    text,
    className: `${baseClasses} ${colorClass}`,
    bgColor: baseConfig.hexColor,
  }
}

/**
 * Gets badge configuration for task priority with type safety
 *
 * @param priority - Task priority enum value
 * @returns Badge configuration with color and hex color
 *
 * @example
 * ```typescript
 * const { color, hexColor } = getTaskPriorityBadge("high");
 * ```
 */
export const getTaskPriorityBadge = (
  priority: TaskPriority | undefined | null
): BadgeConfig & { hexColor: string } => {
  // Handle undefined/null priority values
  if (!priority) {
    return { color: 'bg-gray-500', hexColor: '#6b7280' }
  }

  // Normalize the priority value to lowercase to handle case sensitivity
  const normalizedPriority = priority.toString().toLowerCase() as TaskPriority

  const priorityConfig: Record<TaskPriority, BadgeConfig & { hexColor: string }> = {
    low: {
      color: 'bg-green-500',
      hexColor: '#22c55e',
    },
    medium: {
      color: 'bg-orange-500',
      hexColor: '#f97316',
    },
    high: {
      color: 'bg-red-600',
      hexColor: '#dc2626',
    },
  }

  const result = priorityConfig[normalizedPriority] || { color: 'bg-gray-500', hexColor: '#6b7280' }

  return result
}

/**
 * Gets comprehensive task priority badge configuration with text and styling
 * Provides consistent badge appearance across all components
 *
 * @param priority - Task priority
 * @returns Complete badge configuration with colors, text, and styling
 */
export const getTaskPriorityBadgeConfig = (priority: TaskPriority | undefined | null) => {
  const baseConfig = getTaskPriorityBadge(priority)

  const priorityTextConfig: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  }

  const normalizedPriority = priority?.toString().toLowerCase() as TaskPriority
  const text = priorityTextConfig[normalizedPriority] || 'No Priority'

  // Consistent styling classes
  const baseClasses = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium'

  // Color-specific classes for consistent styling
  const colorClasses: Record<string, string> = {
    '#22c55e': 'bg-green-100 text-green-700', // low
    '#f97316': 'bg-orange-100 text-orange-700', // medium
    '#dc2626': 'bg-red-100 text-red-700', // high
    '#6b7280': 'bg-gray-100 text-gray-700', // no priority
  }

  const colorClass = colorClasses[baseConfig.hexColor] || 'bg-gray-100 text-gray-700'

  return {
    ...baseConfig,
    text,
    className: `${baseClasses} ${colorClass}`,
    bgColor: baseConfig.hexColor,
  }
}

/**
 * Formats a number as Indonesian Rupiah currency (IDR) with type safety
 *
 * @param value - Number or string to format
 * @param options - Formatting options
 * @returns Formatted Indonesian Rupiah string
 *
 * @example
 * ```typescript
 * formatRupiah(1234567) // "Rp 1.234.567"
 * formatRupiah("1234567", { withSymbol: false }) // "1.234.567"
 * formatRupiah(null) // ""
 * ```
 */
export function formatRupiah(
  value: number | string | null | undefined,
  options: Pick<CurrencyFormatOptions, 'withSymbol'> = { withSymbol: true }
): string {
  if (value === null || value === undefined) {
    return ''
  }

  const numValue = typeof value === 'string' ? Number(parseCurrencyInput(value)) : value

  if (!Number.isFinite(numValue)) {
    return ''
  }

  const formatted = new Intl.NumberFormat('id-ID').format(numValue)
  return options.withSymbol ? `Rp ${formatted}` : formatted
}

/**
 * Generic currency formatting function with full type safety
 *
 * @param value - Number or string to format
 * @param options - Comprehensive formatting options
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(1234.56, { currency: 'USD' }) // "$1,234.56"
 * formatCurrency(1234567, { currency: 'IDR', locale: 'id-ID' }) // "Rp 1.234.567"
 * ```
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: CurrencyFormatOptions = { withSymbol: true, currency: 'USD', locale: 'en-US' }
): string {
  if (value === null || value === undefined) {
    return ''
  }

  const numValue = typeof value === 'string' ? Number(parseCurrencyInput(value)) : value

  if (!Number.isFinite(numValue)) {
    return ''
  }

  const { withSymbol = true, currency = 'USD', locale = 'en-US' } = options
  const formatted = new Intl.NumberFormat(locale).format(numValue)

  if (!withSymbol) {
    return formatted
  }

  const symbol = currency === 'USD' ? '$' : currency === 'IDR' ? 'Rp ' : ''
  return `${symbol}${formatted}`
}

/**
 * Formats a raw number string into a currency-like string with thousand separators (dots for Indonesian format).
 * Example: "1234567" -> "1.234.567"
 * @param rawValue The raw number string.
 * @returns Formatted string or an empty string if input is invalid or empty.
 */
export function formatCurrencyInput(rawValue: string): string {
  if (!rawValue || typeof rawValue !== 'string') {
    return ''
  }
  const justDigits = rawValue.replace(/\D/g, '')
  if (!justDigits) {
    return ''
  }
  return new Intl.NumberFormat('id-ID').format(Number(justDigits))
}

/**
 * Parses a currency-formatted string back into a raw number string.
 * Example: "1.234.567" -> "1234567" (Indonesian format) or "1,234,567" -> "1234567" (US format)
 * @param formattedValue The formatted currency string.
 * @returns Raw number string.
 */
export function parseCurrencyInput(formattedValue: string): string {
  if (!formattedValue || typeof formattedValue !== 'string') {
    return ''
  }
  return formattedValue.replace(/\D/g, '')
}
