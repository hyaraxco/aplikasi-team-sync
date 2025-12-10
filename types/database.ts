/**
 * @fileoverview Database entity type definitions for Team Sync application
 *
 * This module contains all Firestore database entity types, enums, and interfaces
 * used throughout the application for data modeling and type safety.
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

import { FieldValue, Timestamp } from 'firebase/firestore'

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User role enumeration
 */
export type UserRole = 'admin' | 'employee'

/**
 * User account data structure
 */
export interface UserData {
  id: string
  email: string
  displayName: string
  bio?: string
  photoURL?: string
  role: UserRole
  status: 'active' | 'inactive' | 'pending'
  createdAt: Timestamp
  updatedAt: Timestamp
  department?: string
  position?: string
  phoneNumber?: string
  lastActive?: Timestamp
  baseSalary?: number
}

// ============================================================================
// EARNING TYPES
// ============================================================================

/**
 * Earnings record for task/attendance compensation
 */
export interface Earning {
  id: string
  userId: string
  type: 'task' | 'attendance'
  refId: string
  amount: number
  createdAt: Timestamp
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

/**
 * Project status enumeration
 */
export type ProjectStatus = 'planning' | 'in-progress' | 'completed' | 'on-hold'

/**
 * Project priority enumeration
 */
export type ProjectPriority = 'low' | 'medium' | 'high'

/**
 * Project metrics interface
 */
export interface ProjectMetrics {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  completionRate: number
  totalTeams: number
  activeMilestones: number
  activeMembers?: number
  budgetSpent?: number
  hoursLogged?: number
}

/**
 * Milestone interface for project milestones
 */
export interface Milestone {
  id: string
  title: string
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue'
  dueDate: Timestamp
  progress?: number
  description?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

/**
 * Project data structure with status and priority
 */
export interface Project {
  id: string
  name: string
  description?: string
  deadline: Timestamp
  status: ProjectStatus
  teams: string[]
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
  priority: ProjectPriority
  taskIds?: string[]
  metrics?: ProjectMetrics
  client?: string
  clientContact?: string
  budget?: number
  lead?: string
  projectManager?: {
    userId: string
    name: string
    email: string
    phone?: string
    role: string
    photoURL?: string
  }
  milestones?: Milestone[]
  allowedStatuses?: ProjectStatus[]
  isArchived?: boolean
  lastActivityAt?: Timestamp
  memberIds?: string[]
}

// ============================================================================
// TASK TYPES
// ============================================================================

/**
 * Task status enumeration
 */
export type TaskStatus =
  | 'backlog'
  | 'in_progress'
  | 'completed'
  | 'revision'
  | 'done'
  | 'blocked'
  | 'rejected'

/**
 * Task priority enumeration
 */
export type TaskPriority = 'low' | 'medium' | 'high'

/**
 * Task comment interface
 */
export interface TaskComment {
  id: string
  userId: string
  userName: string
  userPhotoURL?: string
  content: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}

/**
 * Task attachment interface - Cloudinary only
 */
export interface TaskAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  uploadedBy: string
  uploadedByRole: 'admin' | 'employee'
  uploadedAt: Timestamp
  attachmentType: 'context' | 'result' | 'feedback'
  // Cloudinary specific fields
  publicId: string
  secureUrl: string
  storageProvider: 'cloudinary'
}

/**
 * Task data structure with assignments and comments
 */
export interface Task {
  id: string
  name: string
  description?: string
  projectId: string
  assignedTo?: string[]
  status: TaskStatus
  priority: TaskPriority
  deadline: Timestamp
  taskRate?: number
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
  teamId?: string
  comments?: TaskComment[]
  attachments?: TaskAttachment[]
  employeeComment?: string
  reviewComment?: string
}

// ============================================================================
// TEAM TYPES
// ============================================================================

/**
 * Team member data with role and status
 */
export interface TeamMember {
  userId: string
  role: string
  joinedAt: Timestamp
  status?: string
}

/**
 * Team metrics interface
 */
export interface TeamMetrics {
  totalMembers: number
  activeProjects: number
  pendingTasks: number
  completedTasks: number
  totalTasks: number
  completionRate: number
}

/**
 * Team data structure with members and roles
 */
export interface Team {
  id: string
  name: string
  description?: string
  members: TeamMember[]
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
  metrics?: TeamMetrics
  memberDetails?: UserData[]
  lead?: {
    userId: string
    name: string
    email: string
    phone?: string
    role: string
    photoURL?: string
  }
}

// ============================================================================
// ATTENDANCE TYPES
// ============================================================================

/**
 * Attendance record with check-in/out times
 */
export interface AttendanceRecord {
  id: string
  userId: string
  date: Timestamp
  checkIn: Timestamp
  checkOut?: Timestamp
  hoursWorked?: number
  baseSalary: number
  earnings?: number
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  teamId?: string
}

// ============================================================================
// PAYROLL TYPES
// ============================================================================

/**
 * Payroll status enumeration
 */
export type PayrollStatus = 'pending' | 'processing' | 'paid' | 'failed'

/**
 * Payroll record with earnings and status
 */
export interface Payroll {
  id: string
  userId: string
  period: string
  startDate: Timestamp
  endDate: Timestamp
  taskEarnings: number
  attendanceEarnings: number
  totalEarnings: number
  status: PayrollStatus
  processedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  approvedBy?: string
}

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

/**
 * Activity type categorization
 */
export type ActivityType =
  | 'project'
  | 'task'
  | 'team'
  | 'attendance'
  | 'payroll'
  | 'user'
  | 'auth'
  | 'earning'
  | 'security'

/**
 * Activity action type enumeration
 */
export enum ActivityActionType {
  // Project Actions
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',
  // Task Actions
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_COMPLETED = 'task_completed',
  TASK_ASSIGNED = 'task_assigned',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_SUBMITTED_FOR_REVIEW = 'task_submitted_for_review',
  TASK_APPROVED_WITH_EARNING = 'task_approved_with_earning',
  TASK_APPROVED_NO_EARNING = 'task_approved_no_earning',
  TASK_REVISION_REQUESTED = 'task_revision_requested',
  // Team Actions
  TEAM_CREATED = 'team_created',
  TEAM_UPDATED = 'team_updated',
  TEAM_DELETED = 'team_deleted',
  TEAM_MEMBER_ADDED = 'team_member_added',
  TEAM_MEMBER_REMOVED = 'team_member_removed',
  TEAM_MEMBER_ROLE_UPDATED = 'team_member_role_updated',
  TEAM_MEMBER_STATUS_UPDATED = 'team_member_status_updated',
  TEAM_MEMBER_DETAILS_UPDATED = 'team_member_details_updated',
  TEAM_LEAD_CHANGED = 'team_lead_changed',
  // Attendance Actions
  ATTENDANCE_CHECK_IN = 'attendance_check_in',
  ATTENDANCE_CHECK_OUT = 'attendance_check_out',
  ATTENDANCE_UPDATED = 'attendance_updated',
  ATTENDANCE_RECORD_UPDATED = 'attendance_record_updated',
  // Payroll Actions
  PAYROLL_GENERATED = 'payroll_generated',
  PAYROLL_PROCESSED = 'payroll_processed',
  PAYROLL_PAID = 'payroll_paid',
  PAYROLL_STATUS_UPDATED = 'payroll_status_updated',
  // User Actions
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_ROLE_CHANGED = 'user_role_changed',
  USER_STATUS_CHANGED = 'user_status_changed',
  USER_PROFILE_UPDATED = 'user_profile_updated',
  USER_REGISTERED_PENDING_APPROVAL = 'user_registered_pending_approval',
  USER_ACTIVATED = 'user_activated',
  USER_DEACTIVATED = 'user_deactivated',
  USER_REACTIVATED = 'user_reactivated',
  USER_PERMANENTLY_DELETED = 'user_permanently_deleted',
  // Auth Actions
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_PASSWORD_CHANGE = 'auth_password_change',
  AUTH_ROLE_CHANGE = 'auth_role_change',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  // Earning Actions
  EARNING_CREATED = 'earning_created',
  EARNING_UPDATED = 'earning_updated',
}

/**
 * Activity log entry for audit trail
 */
export interface Activity {
  id: string
  userId: string
  type: ActivityType
  action: ActivityActionType
  targetId?: string
  targetName?: string
  timestamp: Timestamp | FieldValue
  teamId?: string
  details?: Record<string, any>
  status?: 'read' | 'unread'
  authId?: string
}

// ============================================================================
// BASE ENTITY TYPE
// ============================================================================

/**
 * Generic type for database entities with common fields
 */
export interface BaseEntity {
  id: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
