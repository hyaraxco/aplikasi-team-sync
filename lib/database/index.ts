/**
 * @fileoverview Database operations index - Main exports for database functionality
 *
 * This module provides a centralized export point for all database operations,
 * making it easy to import database functions throughout the application.
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

// Re-export all database operations from firestore
export * from './firestore'

// Re-export data consistency utilities
export * from './consistency'

// Re-export activity formatting utilities
export * from './activity'

// Re-export all types from centralized types
export type {
  Activity,
  ActivityType,
  AttendanceRecord,
  BaseEntity,
  Earning,
  Milestone,
  Payroll,
  PayrollStatus,
  Project,
  ProjectMetrics,
  ProjectPriority,
  ProjectStatus,
  Task,
  TaskComment,
  TaskPriority,
  TaskStatus,
  Team,
  TeamMember,
  TeamMetrics,
  UserData,
  UserRole,
} from '@/types/database'

// Export enums as values
export { ActivityActionType } from '@/types/database'
