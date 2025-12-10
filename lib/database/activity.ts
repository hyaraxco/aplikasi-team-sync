/**
 * @fileoverview Activity Formatter - Comprehensive activity logging and formatting utilities
 *
 * This module provides robust, type-safe activity formatting for the team sync application.
 * It handles various activity types including tasks, projects, teams, attendance, and user management.
 *
 * Features:
 * - Type-safe activity interfaces and enums
 * - Human-readable message formatting with proper English text
 * - Relative timestamp formatting (e.g., "2 hours ago", "yesterday")
 * - Support for different activity categories and contexts
 * - Error handling for malformed activity data
 * - Integration with existing Firestore data structure
 *
 * @example
 * ```typescript
 * import { formatActivityMessage, formatRelativeTime, ActivityCategory } from '@/lib/activity-formatter'
 *
 * // Format activity message
 * const message = formatActivityMessage(activity, 'John Doe')
 * // Result: "John Doe created task: Implement user authentication"
 *
 * // Format relative time
 * const timeAgo = formatRelativeTime(activity.timestamp)
 * // Result: "2 hours ago"
 * ```
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

import { isFirestoreTimestamp } from '@/types'
import {
  ActivityActionType,
  type ActivityType,
  type Activity as BaseActivity,
  type UserData,
  type UserRole,
} from '@/types/database'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Extended Activity interface that supports both enum and legacy string actions
 * for backward compatibility while maintaining type safety
 */
export interface Activity extends Omit<BaseActivity, 'action'> {
  /** Activity action - supports both enum values and legacy strings */
  action: ActivityActionType | string
}

/**
 * Activity category groupings for better organization and filtering
 */
export enum ActivityCategory {
  /** Task-related activities (creation, updates, assignments, status changes) */
  TASK = 'task',
  /** Project-related activities (creation, updates, milestones) */
  PROJECT = 'project',
  /** Team-related activities (member management, role changes) */
  TEAM = 'team',
  /** User-related activities (profile updates, role changes, activation) */
  USER = 'user',
  /** Authentication activities (login, logout, password changes) */
  AUTH = 'auth',
  /** Attendance activities (check-in, check-out) */
  ATTENDANCE = 'attendance',
  /** Payroll activities (generation, status updates) */
  PAYROLL = 'payroll',
  /** Earning activities (creation, updates) */
  EARNING = 'earning',
  /** Security activities (admin actions, security events) */
  SECURITY = 'security',
}

/**
 * User information for actor name resolution
 */
export interface ActorInfo {
  /** User ID */
  userId: string
  /** User display name */
  displayName?: string
  /** User email address */
  email?: string
  /** User role (admin/employee) */
  role?: UserRole
  /** Whether to include role in the display name */
  includeRole?: boolean
}

/**
 * Options for actor name formatting
 */
export interface ActorNameOptions {
  /** Whether to include role context (e.g., "Admin John Doe") */
  includeRole?: boolean
  /** Whether to show user ID in fallback (e.g., "Unknown User (ID: abc123)") */
  showUserIdInFallback?: boolean
  /** Custom fallback name when user data is not available */
  fallbackName?: string
}

/**
 * Activity context information for enhanced message formatting
 */
export interface ActivityContext {
  /** The user who performed the activity */
  actorName: string
  /** Target entity name (task, project, team, etc.) */
  targetName?: string
  /** Additional context details */
  details?: Record<string, any>
  /** Activity category for grouping */
  category?: ActivityCategory
}

/**
 * Options for formatting relative time
 */
export interface RelativeTimeOptions {
  /** Include "ago" suffix (default: true) */
  includeSuffix?: boolean
  /** Use short format (e.g., "2h" instead of "2 hours") */
  shortFormat?: boolean
  /** Maximum days before showing full date (default: 7) */
  maxDays?: number
}

/**
 * Activity formatting result with message and metadata
 */
export interface FormattedActivity {
  /** Human-readable activity message */
  message: string
  /** Relative time string (e.g., "2 hours ago") */
  timeAgo: string
  /** Activity category */
  category: ActivityCategory
  /** Whether the activity is recent (within last hour) */
  isRecent: boolean
  /** Original activity data */
  activity: Activity
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines the activity category based on the activity type and action
 *
 * @param activity - The activity to categorize
 * @returns The appropriate activity category
 *
 * @example
 * ```typescript
 * const category = getActivityCategory(taskActivity)
 * // Returns: ActivityCategory.TASK
 * ```
 */
export function getActivityCategory(activity: Activity): ActivityCategory {
  // Direct mapping from activity type to category
  const typeToCategory: Record<ActivityType, ActivityCategory> = {
    task: ActivityCategory.TASK,
    project: ActivityCategory.PROJECT,
    team: ActivityCategory.TEAM,
    user: ActivityCategory.USER,
    auth: ActivityCategory.AUTH,
    attendance: ActivityCategory.ATTENDANCE,
    payroll: ActivityCategory.PAYROLL,
    earning: ActivityCategory.EARNING,
    security: ActivityCategory.SECURITY,
  }

  return typeToCategory[activity.type] || ActivityCategory.TASK
}

/**
 * Safely extracts target name from activity data with fallback logic
 *
 * @param activity - The activity to extract target name from
 * @returns A user-friendly target name or fallback
 *
 * @example
 * ```typescript
 * const target = getActivityTarget(activity)
 * // Returns: "User Authentication Task" or "ID: abc123" or "an item"
 * ```
 */
export function getActivityTarget(activity: Activity): string {
  if (activity.targetName) {
    return activity.targetName
  }

  if (activity.targetId) {
    return `ID: ${activity.targetId.substring(0, 8)}`
  }

  return 'an item'
}

/**
 * Resolves a user-friendly actor name from user data with proper fallback hierarchy
 *
 * This function implements the standard name resolution pattern used throughout the application:
 * 1. Use display name if available
 * 2. Fall back to email address
 * 3. Fall back to "Unknown User" with optional user ID for debugging
 * 4. Optionally include role context (e.g., "Admin John Doe")
 *
 * @param actorInfo - User information for name resolution
 * @param options - Optional formatting options
 * @returns A user-friendly actor name
 *
 */
export function resolveActorName(actorInfo: ActorInfo, options: ActorNameOptions = {}): string {
  const {
    includeRole = false,
    showUserIdInFallback = true,
    fallbackName = 'Unknown User',
  } = options

  try {
    // Validate input
    if (!actorInfo || !actorInfo.userId) {
      return fallbackName
    }

    // Determine base name using fallback hierarchy
    let baseName: string

    if (actorInfo.displayName && actorInfo.displayName.trim()) {
      baseName = actorInfo.displayName.trim()
    } else if (actorInfo.email && actorInfo.email.trim()) {
      baseName = actorInfo.email.trim()
    } else {
      // Ultimate fallback with optional user ID
      if (showUserIdInFallback && actorInfo.userId) {
        const shortId = actorInfo.userId.substring(0, 8)
        baseName = `${fallbackName} (ID: ${shortId})`
      } else {
        baseName = fallbackName
      }
    }

    // Add role context if requested and available
    if (includeRole && actorInfo.role && baseName !== fallbackName) {
      const rolePrefix = actorInfo.role === 'admin' ? 'Admin' : 'Employee'
      return `${rolePrefix} ${baseName}`
    }

    return baseName
  } catch (error) {
    console.error('Error resolving actor name:', error, { actorInfo, options })
    return showUserIdInFallback && actorInfo?.userId
      ? `${fallbackName} (ID: ${actorInfo.userId.substring(0, 8)})`
      : fallbackName
  }
}

/**
 * Resolves actor name from UserData object (convenience function)
 *
 * @param userData - Complete user data object
 * @param options - Optional formatting options
 * @returns A user-friendly actor name
 *
 * @example
 * ```typescript
 * const user = await getUserData(userId)
 * const actorName = resolveActorNameFromUserData(user, { includeRole: true })
 * // Returns: "Admin John Doe" or "Employee Jane Smith"
 * ```
 */
export function resolveActorNameFromUserData(
  userData: UserData | null | undefined,
  options: ActorNameOptions = {}
): string {
  if (!userData) {
    return options.fallbackName || 'Unknown User'
  }

  return resolveActorName(
    {
      userId: userData.id,
      displayName: userData.displayName,
      email: userData.email,
      role: userData.role,
    },
    options
  )
}

/**
 * Creates a user lookup function for batch processing activities
 *
 * @param users - Array of user data or Map of userId to UserData
 * @param options - Optional formatting options applied to all lookups
 * @returns Function that resolves user names by user ID
 *
 * @example
 * ```typescript
 * const users = await getUsers()
 * const getUserName = createUserLookupFunction(users, { includeRole: true })
 *
 * const formatted = formatActivities(activities, getUserName)
 * ```
 */
export function createUserLookupFunction(
  users: UserData[] | Map<string, UserData>,
  options: ActorNameOptions = {}
): (userId: string) => string {
  // Convert array to Map for efficient lookup
  const userMap = users instanceof Map ? users : new Map(users.map(user => [user.id, user]))

  return (userId: string): string => {
    const userData = userMap.get(userId)
    return resolveActorNameFromUserData(userData, options)
  }
}

/**
 * Formats a Firebase Timestamp into a relative time string with proper error handling
 *
 * @param timestamp - Firebase Timestamp or timestamp-like object
 * @param options - Formatting options
 * @returns Relative time string (e.g., "2 hours ago", "yesterday")
 *
 * @example
 * ```typescript
 * formatRelativeTime(firestoreTimestamp)
 * // Returns: "2 hours ago"
 *
 * formatRelativeTime(timestamp, { shortFormat: true })
 * // Returns: "2h ago"
 *
 * formatRelativeTime(oldTimestamp, { maxDays: 3 })
 * // Returns: "Dec 25, 2023" (if older than 3 days)
 * ```
 */
export function formatRelativeTime(timestamp: any, options: RelativeTimeOptions = {}): string {
  const { includeSuffix = true, shortFormat = false, maxDays = 7 } = options

  try {
    // Validate timestamp
    if (!timestamp) {
      return 'Unknown time'
    }

    let date: Date

    // Handle Firestore Timestamp
    if (isFirestoreTimestamp(timestamp)) {
      date = timestamp.toDate()
    }
    // Handle objects with seconds/nanoseconds (Firestore-like)
    else if (timestamp && typeof timestamp === 'object' && typeof timestamp.seconds === 'number') {
      date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000)
    }
    // Handle Date objects
    else if (timestamp instanceof Date) {
      date = timestamp
    }
    // Handle string/number timestamps
    else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp)
    } else {
      throw new Error('Unsupported timestamp format')
    }

    // Validate the resulting date
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }

    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    // Handle future dates
    if (diffInSeconds < 0) {
      return 'In the future'
    }

    // Just now (less than 5 seconds)
    if (diffInSeconds < 5) {
      return 'just now'
    }

    // Seconds
    if (diffInSeconds < 60) {
      const suffix = includeSuffix ? ' ago' : ''
      return shortFormat
        ? `${diffInSeconds}s${suffix}`
        : `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''}${suffix}`
    }

    // Minutes
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      const suffix = includeSuffix ? ' ago' : ''
      return shortFormat
        ? `${diffInMinutes}m${suffix}`
        : `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}${suffix}`
    }

    // Hours
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      const suffix = includeSuffix ? ' ago' : ''
      return shortFormat
        ? `${diffInHours}h${suffix}`
        : `${diffInHours} hour${diffInHours !== 1 ? 's' : ''}${suffix}`
    }

    // Days
    const diffInDays = Math.floor(diffInHours / 24)

    // Yesterday
    if (diffInDays === 1) {
      return 'yesterday'
    }

    // Recent days
    if (diffInDays < maxDays) {
      const suffix = includeSuffix ? ' ago' : ''
      return shortFormat
        ? `${diffInDays}d${suffix}`
        : `${diffInDays} day${diffInDays !== 1 ? 's' : ''}${suffix}`
    }

    // Older dates - show full date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  } catch (error) {
    console.error('Error formatting relative time:', error, { timestamp })
    return 'Unknown time'
  }
}

// ============================================================================
// ACTIVITY MESSAGE FORMATTING
// ============================================================================

/**
 * Formats task-related activities into human-readable messages
 *
 * @param activity - The task activity to format
 * @param actorName - Name of the person who performed the activity
 * @param target - Target entity name
 * @returns Formatted message string
 */
function formatTaskActivity(activity: Activity, actorName: string, target: string): string {
  const details = activity.details || {}

  switch (activity.action as ActivityActionType) {
    case ActivityActionType.TASK_CREATED:
      return `${actorName} created task: ${target}`

    case ActivityActionType.TASK_UPDATED:
      return `${actorName} updated task: ${target}`

    case ActivityActionType.TASK_COMPLETED:
      return `${actorName} completed task: ${target}`

    case ActivityActionType.TASK_ASSIGNED:
      const assigneeName = details.assignedToName || details.assignedTo || 'someone'
      return `${actorName} assigned task "${target}" to ${assigneeName}`

    case ActivityActionType.TASK_STATUS_CHANGED:
      const newStatus = details.newStatus || 'a new status'
      const previousStatus = details.previousStatus
      if (previousStatus) {
        return `${actorName} changed status of "${target}" from ${previousStatus} to ${newStatus}`
      }
      return `${actorName} changed status of "${target}" to ${newStatus}`

    case ActivityActionType.TASK_SUBMITTED_FOR_REVIEW:
      return `${actorName} submitted task "${target}" for review`

    case ActivityActionType.TASK_APPROVED_WITH_EARNING:
      const rate = details.rate ? ` (Rate: Rp ${details.rate.toLocaleString('id-ID')})` : ''
      return `${actorName} approved task "${target}" with earning${rate}`

    case ActivityActionType.TASK_APPROVED_NO_EARNING:
      return `${actorName} approved task "${target}"`

    case ActivityActionType.TASK_REVISION_REQUESTED:
      const note = details.note || details.revisionNote
      if (note) {
        return `${actorName} requested revision for "${target}": ${note}`
      }
      return `${actorName} requested revision for "${target}"`

    default:
      return `${actorName} performed an action on task: ${target}`
  }
}

/**
 * Formats project-related activities into human-readable messages
 *
 * @param activity - The project activity to format
 * @param actorName - Name of the person who performed the activity
 * @param target - Target entity name
 * @returns Formatted message string
 */
function formatProjectActivity(activity: Activity, actorName: string, target: string): string {
  const details = activity.details || {}

  switch (activity.action as ActivityActionType) {
    case ActivityActionType.PROJECT_CREATED:
      const teams = details.teams
      if (teams && teams.length > 0) {
        return `${actorName} created project "${target}" with ${teams.length} team${teams.length !== 1 ? 's' : ''}`
      }
      return `${actorName} created project: ${target}`

    case ActivityActionType.PROJECT_UPDATED:
      const updateAction = details.action
      if (updateAction === 'milestone_added') {
        const milestoneName = details.milestoneName || 'a milestone'
        return `${actorName} added milestone "${milestoneName}" to project "${target}"`
      }
      if (updateAction === 'milestone_updated') {
        const milestoneName = details.milestoneName || 'a milestone'
        return `${actorName} updated milestone "${milestoneName}" in project "${target}"`
      }
      if (updateAction === 'milestone_deleted') {
        const milestoneName = details.milestoneName || 'a milestone'
        return `${actorName} deleted milestone "${milestoneName}" from project "${target}"`
      }
      return `${actorName} updated project: ${target}`

    case ActivityActionType.PROJECT_DELETED:
      return `${actorName} deleted project: ${target}`

    default:
      return `${actorName} performed an action on project: ${target}`
  }
}

/**
 * Formats team-related activities into human-readable messages
 *
 * @param activity - The team activity to format
 * @param actorName - Name of the person who performed the activity
 * @param target - Target entity name
 * @returns Formatted message string
 */
function formatTeamActivity(activity: Activity, actorName: string, target: string): string {
  const details = activity.details || {}

  switch (activity.action as ActivityActionType) {
    case ActivityActionType.TEAM_CREATED:
      return `${actorName} created team: ${target}`

    case ActivityActionType.TEAM_UPDATED:
      return `${actorName} updated team: ${target}`

    case ActivityActionType.TEAM_DELETED:
      return `${actorName} deleted team: ${target}`

    case ActivityActionType.TEAM_MEMBER_ADDED:
      const addedMemberName = details.addedMemberName || details.memberName || 'a new member'
      return `${actorName} added ${addedMemberName} to team "${target}"`

    case ActivityActionType.TEAM_MEMBER_REMOVED:
      const removedMemberName = details.memberName || 'a member'
      return `${actorName} removed ${removedMemberName} from team "${target}"`

    case ActivityActionType.TEAM_MEMBER_ROLE_UPDATED:
      const memberName = details.memberName || 'a member'
      const newRole = details.newRole || details.role || 'a new role'
      return `${actorName} updated role for ${memberName} in team "${target}" to ${newRole}`

    case ActivityActionType.TEAM_MEMBER_STATUS_UPDATED:
      const statusMemberName = details.memberName || 'a member'
      const newStatus = details.newStatus || details.status || 'a new status'
      return `${actorName} updated status for ${statusMemberName} in team "${target}" to ${newStatus}`

    case ActivityActionType.TEAM_MEMBER_DETAILS_UPDATED:
      const updatedMemberName = details.memberName || target
      const teamName = details.teamName || 'the team'
      return `${actorName} updated details for ${updatedMemberName} in ${teamName}`

    case ActivityActionType.TEAM_LEAD_CHANGED:
      const newLeadName = details.newLeadName || details.newLead || 'a new lead'
      return `${actorName} changed lead of team "${target}" to ${newLeadName}`

    default:
      return `${actorName} performed an action on team: ${target}`
  }
}

/**
 * Formats user-related activities into human-readable messages
 *
 * @param activity - The user activity to format
 * @param actorName - Name of the person who performed the activity
 * @param target - Target entity name
 * @returns Formatted message string
 */
function formatUserActivity(activity: Activity, actorName: string, target: string): string {
  const details = activity.details || {}

  switch (activity.action as ActivityActionType) {
    case ActivityActionType.USER_CREATED:
      return `${actorName} created new employee: ${target}`

    case ActivityActionType.USER_UPDATED:
    case ActivityActionType.USER_PROFILE_UPDATED:
      return `${actorName} updated employee profile: ${target}`

    case ActivityActionType.USER_ACTIVATED:
      return `${actorName} activated employee: ${target}`

    case ActivityActionType.USER_DEACTIVATED:
      return `${actorName} deactivated employee: ${target}`

    case ActivityActionType.USER_REACTIVATED:
      return `${actorName} reactivated employee: ${target}`

    case ActivityActionType.USER_REGISTERED_PENDING_APPROVAL:
      return `${target} registered and is pending approval`

    case ActivityActionType.AUTH_ROLE_CHANGE:
      const newRole = details.newRole || details.role || 'a new role'
      return `${actorName} changed role to ${newRole}`

    default:
      return `${actorName} performed an action on user: ${target}`
  }
}

/**
 * Formats authentication-related activities into human-readable messages
 *
 * @param activity - The auth activity to format
 * @param actorName - Name of the person who performed the activity
 * @param target - Target entity name
 * @returns Formatted message string
 */
function formatAuthActivity(activity: Activity, actorName: string, target: string): string {
  switch (activity.action as ActivityActionType) {
    case ActivityActionType.AUTH_LOGIN:
      return `${actorName} logged in`

    case ActivityActionType.AUTH_LOGOUT:
      return `${actorName} logged out`

    case ActivityActionType.AUTH_PASSWORD_CHANGE:
      return `${actorName} changed password`

    default:
      return `${actorName} performed an authentication action`
  }
}

/**
 * Formats attendance-related activities into human-readable messages
 *
 * @param activity - The attendance activity to format
 * @param actorName - Name of the person who performed the activity
 * @param target - Target entity name
 * @returns Formatted message string
 */
function formatAttendanceActivity(activity: Activity, actorName: string, target: string): string {
  const details = activity.details || {}

  switch (activity.action as ActivityActionType) {
    case ActivityActionType.ATTENDANCE_CHECK_IN:
      return `${actorName} checked in`

    case ActivityActionType.ATTENDANCE_CHECK_OUT:
      const hours = details.hours
      if (hours) {
        return `${actorName} checked out (${hours} hours worked)`
      }
      return `${actorName} checked out`

    case ActivityActionType.ATTENDANCE_RECORD_UPDATED:
      return `${actorName} updated attendance record`

    default:
      return `${actorName} performed an attendance action`
  }
}

/**
 * Formats payroll and earning activities into human-readable messages
 *
 * @param activity - The payroll/earning activity to format
 * @param actorName - Name of the person who performed the activity
 * @param target - Target entity name
 * @returns Formatted message string
 */
function formatPayrollActivity(activity: Activity, actorName: string, target: string): string {
  const details = activity.details || {}

  switch (activity.action as ActivityActionType) {
    case ActivityActionType.PAYROLL_GENERATED:
      const period = details.period || 'a period'
      return `${actorName} generated payroll for ${period}`

    case ActivityActionType.PAYROLL_STATUS_UPDATED:
      const newStatus = details.newStatus || 'a new status'
      return `${actorName} updated payroll status to ${newStatus}`

    case ActivityActionType.EARNING_CREATED:
      const amount = details.amount
      if (amount) {
        return `${actorName} earned Rp ${amount.toLocaleString('id-ID')}`
      }
      return `${actorName} received an earning`

    default:
      return `${actorName} performed a payroll action`
  }
}

// ============================================================================
// MAIN PUBLIC FUNCTIONS
// ============================================================================

/**
 * Formats an activity record into a human-readable message with enhanced actor name resolution
 *
 * This function provides enhanced formatting with proper user name resolution and optional role context.
 * It's the recommended way to format activities when you have access to user data.
 *
 * @param activity - The activity record to format
 * @param actorInfo - User information for name resolution
 * @param options - Optional formatting options
 * @returns A formatted string describing the activity
 *
 * @example
 * ```typescript
 * // With user data
 * const message = formatActivityMessageWithUserData(activity, {
 *   userId: 'user123',
 *   displayName: 'John Doe',
 *   email: 'john@example.com',
 *   role: 'admin'
 * }, { includeRole: true })
 * // Returns: "Admin John Doe created task: Implement user authentication"
 *
 * // Fallback scenario
 * const message = formatActivityMessageWithUserData(activity, {
 *   userId: 'user123'
 * })
 * // Returns: "Unknown User (ID: user123) created task: Implement user authentication"
 * ```
 */
export function formatActivityMessageWithUserData(
  activity: Activity,
  actorInfo: ActorInfo,
  options: ActorNameOptions = {}
): string {
  const actorName = resolveActorName(actorInfo, options)
  return formatActivityMessage(activity, actorName)
}

/**
 * Formats an activity record into a human-readable message with proper error handling
 *
 * This is the main function for formatting activity messages. It handles all activity types
 * and provides fallback logic for unknown or malformed activities.
 *
 * @param activity - The activity record to format
 * @param actorName - The display name of the actor who performed the activity
 * @returns A formatted string describing the activity
 *
 * @example
 * ```typescript
 * const message = formatActivityMessage(taskActivity, 'John Doe')
 * // Returns: "John Doe created task: Implement user authentication"
 *
 * const message = formatActivityMessage(projectActivity, 'Jane Smith')
 * // Returns: "Jane Smith updated project: Team Sync Application"
 * ```
 */
export function formatActivityMessage(activity: Activity, actorName: string): string {
  try {
    // Validate inputs
    if (!activity) {
      return 'Unknown activity occurred'
    }

    if (!actorName || typeof actorName !== 'string') {
      actorName = 'Someone'
    }

    const target = getActivityTarget(activity)
    const category = getActivityCategory(activity)

    // Route to appropriate formatter based on category
    switch (category) {
      case ActivityCategory.TASK:
        return formatTaskActivity(activity, actorName, target)

      case ActivityCategory.PROJECT:
        return formatProjectActivity(activity, actorName, target)

      case ActivityCategory.TEAM:
        return formatTeamActivity(activity, actorName, target)

      case ActivityCategory.USER:
        return formatUserActivity(activity, actorName, target)

      case ActivityCategory.AUTH:
        return formatAuthActivity(activity, actorName, target)

      case ActivityCategory.ATTENDANCE:
        return formatAttendanceActivity(activity, actorName, target)

      case ActivityCategory.PAYROLL:
      case ActivityCategory.EARNING:
        return formatPayrollActivity(activity, actorName, target)

      default:
        // Fallback for unknown categories
        return formatLegacyActivity(activity, actorName, target)
    }
  } catch (error) {
    console.error('Error formatting activity message:', error, { activity, actorName })
    return `${actorName} performed an action`
  }
}

/**
 * Handles legacy string-based actions and unknown activity types
 *
 * @param activity - The activity with legacy action format
 * @param actorName - Name of the actor
 * @param target - Target entity name
 * @returns Formatted message string
 */
function formatLegacyActivity(activity: Activity, actorName: string, target: string): string {
  if (typeof activity.action === 'string') {
    // Handle multi-word legacy actions
    if (activity.action.includes(' ')) {
      let message = activity.action
      if (activity.targetName) {
        message += ` ${activity.targetName}`
      }
      return `${actorName} ${message}`
    }

    // Handle single-word legacy actions
    return `${actorName} ${activity.action} ${target}`
  }

  // Ultimate fallback
  return `${actorName} performed an action on ${target}`
}

/**
 * Formats a complete activity with message and relative time
 *
 * This function provides a comprehensive formatting result that includes both
 * the human-readable message and relative time formatting.
 *
 * @param activity - The activity record to format
 * @param actorName - The display name of the actor who performed the activity
 * @param options - Optional formatting options
 * @returns Complete formatted activity information
 *
 * @example
 * ```typescript
 * const formatted = formatActivity(activity, 'John Doe')
 * console.log(formatted.message) // "John Doe created task: User Authentication"
 * console.log(formatted.timeAgo) // "2 hours ago"
 * console.log(formatted.category) // ActivityCategory.TASK
 * console.log(formatted.isRecent) // true
 * ```
 */
export function formatActivity(
  activity: Activity,
  actorName: string,
  options: RelativeTimeOptions = {}
): FormattedActivity {
  try {
    const message = formatActivityMessage(activity, actorName)
    const timeAgo = formatRelativeTime(activity.timestamp, options)
    const category = getActivityCategory(activity)

    // Determine if activity is recent (within last hour)
    const isRecent = (() => {
      try {
        let date: Date

        if (isFirestoreTimestamp(activity.timestamp)) {
          date = activity.timestamp.toDate()
        } else if (
          activity.timestamp &&
          typeof activity.timestamp === 'object' &&
          'seconds' in activity.timestamp &&
          typeof (activity.timestamp as any).seconds === 'number'
        ) {
          date = new Date((activity.timestamp as any).seconds * 1000)
        } else {
          return false
        }

        const now = new Date()
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
        return diffInHours <= 1
      } catch {
        return false
      }
    })()

    return {
      message,
      timeAgo,
      category,
      isRecent,
      activity,
    }
  } catch (error) {
    console.error('Error formatting complete activity:', error, { activity, actorName })

    // Return safe fallback
    return {
      message: `${actorName || 'Someone'} performed an action`,
      timeAgo: 'Unknown time',
      category: ActivityCategory.TASK,
      isRecent: false,
      activity,
    }
  }
}

/**
 * Legacy function name for backward compatibility
 *
 * @deprecated Use formatActivityMessage instead
 * @param activity - The activity record to format
 * @param actorName - The display name of the actor who performed the activity
 * @returns A formatted string describing the activity
 */
export function getActivityDisplayMessage(activity: Activity, actorName: string): string {
  return formatActivityMessage(activity, actorName)
}

/**
 * Batch formats multiple activities with enhanced user data resolution
 *
 * This is the recommended function for formatting multiple activities when you have access
 * to user data. It provides consistent name resolution and optional role context.
 *
 * @param activities - Array of activities to format
 * @param users - Array of user data or Map of userId to UserData
 * @param options - Optional formatting options
 * @param timeOptions - Optional relative time formatting options
 * @returns Array of formatted activities
 *
 * @example
 * ```typescript
 * const users = await getUsers()
 * const formatted = formatActivitiesWithUserData(activities, users, {
 *   includeRole: true,
 *   showUserIdInFallback: true
 * })
 * ```
 */
export function formatActivitiesWithUserData(
  activities: Activity[],
  users: UserData[] | Map<string, UserData>,
  options: ActorNameOptions = {},
  timeOptions: RelativeTimeOptions = {}
): FormattedActivity[] {
  const getUserName = createUserLookupFunction(users, options)

  return activities.map(activity => {
    const actorName = getUserName(activity.userId)
    return formatActivity(activity, actorName, timeOptions)
  })
}

/**
 * Batch formats multiple activities with consistent actor name resolution
 *
 * @param activities - Array of activities to format
 * @param getActorName - Function to resolve actor names from user IDs
 * @param options - Optional formatting options
 * @returns Array of formatted activities
 *
 * @example
 * ```typescript
 * const formatted = formatActivities(activities, (userId) => {
 *   const user = users.find(u => u.id === userId)
 *   return user?.displayName || 'Unknown User'
 * })
 * ```
 */
export function formatActivities(
  activities: Activity[],
  getActorName: (userId: string) => string,
  options: RelativeTimeOptions = {}
): FormattedActivity[] {
  return activities.map(activity => {
    const actorName = getActorName(activity.userId)
    return formatActivity(activity, actorName, options)
  })
}

/**
 * Formats an activity record into a human-readable message with both actor and target user data
 *
 * @param activity - The activity record to format
 * @param actorUser - UserData of the actor (who did the action)
 * @param targetUser - UserData of the target (who/what is affected, can be null)
 * @param options - Optional formatting options
 * @returns A formatted string describing the activity
 */
export function formatActivityMessageWithUsers(
  activity: Activity,
  actorUser: UserData | null | undefined,
  targetUser: UserData | null | undefined,
  options: ActorNameOptions = {}
): string {
  const actorName = resolveActorNameFromUserData(actorUser, options)
  const targetName = targetUser ? resolveActorNameFromUserData(targetUser, options) : undefined
  const details = activity.details || {}
  const target = getActivityTarget(activity)

  // Example for task-related actions
  if (activity.type === 'task') {
    switch (activity.action as ActivityActionType) {
      case ActivityActionType.TASK_REVISION_REQUESTED: {
        const note = details.note || details.revisionNote
        if (targetName && actorName !== targetName) {
          return `${actorName} requested a revision for ${targetName}'s task "${target}": ${note || ''}`.trim()
        } else {
          return `${actorName} requested a revision for their own task "${target}": ${note || ''}`.trim()
        }
      }
      case ActivityActionType.TASK_ASSIGNED: {
        if (targetName && actorName !== targetName) {
          return `${actorName} assigned task "${target}" to ${targetName}`
        } else {
          return `${actorName} was assigned task "${target}"`
        }
      }
      case ActivityActionType.TASK_APPROVED_WITH_EARNING:
      case ActivityActionType.TASK_APPROVED_NO_EARNING: {
        if (targetName && actorName !== targetName) {
          return `${actorName} approved ${targetName}'s task "${target}"`
        } else {
          return `${actorName} approved their own task "${target}"`
        }
      }
      case ActivityActionType.TASK_SUBMITTED_FOR_REVIEW: {
        if (targetName && actorName !== targetName) {
          return `${actorName} submitted task "${target}" for review to ${targetName}`
        } else {
          return `${actorName} submitted task "${target}" for review`
        }
      }
      // Fallback to default
      default: {
        return formatActivityMessage(activity, actorName)
      }
    }
  }
  // For other types, fallback to default
  return formatActivityMessage(activity, actorName)
}
