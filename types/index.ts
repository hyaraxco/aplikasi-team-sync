/**
 * @fileoverview Shared type definitions for the Team Sync application
 *
 * This module contains common type definitions, utility types, and type guards
 * that are used across multiple modules in the application.
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

import { Timestamp } from 'firebase/firestore'

/**
 * Utility type for making specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Utility type for making specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Type for date-like values that can be converted to Date
 */
export type DateLike = Date | Timestamp | string | number

/**
 * Type guard to check if a value is a Firestore Timestamp
 */
export function isFirestoreTimestamp(value: any): value is Timestamp {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.toDate === 'function' &&
    typeof value.seconds === 'number' &&
    typeof value.nanoseconds === 'number'
  )
}

/**
 * Type guard to check if a value is a valid Date
 */
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * Type for currency formatting options
 */
export interface CurrencyFormatOptions {
  /** Whether to include currency symbol */
  withSymbol?: boolean
  /** Currency code (USD, IDR, etc.) */
  currency?: 'USD' | 'IDR' | string
  /** Locale for formatting */
  locale?: string
}

// ============================================================================
// RE-EXPORTS FROM SPECIALIZED TYPE MODULES
// ============================================================================

/**
 * Database entity types
 */
export type {
  // Activity types
  Activity,
  ActivityType,
  // Attendance types
  AttendanceRecord,
  // Base types
  BaseEntity,
  // Earning types
  Earning,
  Milestone,
  // Payroll types
  Payroll,
  PayrollStatus,
  // Project types
  Project,
  ProjectMetrics,
  ProjectPriority,
  ProjectStatus,
  // Task types
  Task,
  TaskAttachment,
  TaskComment,
  TaskPriority,
  TaskStatus,
  // Team types
  Team,
  TeamMember,
  TeamMetrics,
  UserData,
  // User types
  UserRole,
} from './database'

/**
 * UI-related types (filters, sorting, styling)
 */
export type {
  AdvancedFilterState,
  AsyncState,
  BadgeConfig,
  CommonFilterTypes,
  FilterActions,
  FilterBarConfig,
  FilterCondition,
  FilterConfig,
  FilterOperator,
  FilterOption,
  FilterResult,
  FilterState,
  FilterValue,
  NotificationType,
  PaginationParams,
  Theme,
  UseFilterReturn,
  ValidationErrors,
} from './ui'

/**
 * API-related types
 */
export type {
  ApiErrorResponse,
  ApiResponse,
  BaseApiRequest,
  BulkOperationRequest,
  BulkOperationResponse,
  ExportRequest,
  ExportResponse,
  FileUploadRequest,
  FileUploadResponse,
  HealthCheckResponse,
  PaginatedApiResponse,
  PaginatedRequest,
  RateLimitedResponse,
  RateLimitInfo,
  SearchRequest,
  WebhookPayload,
  WebhookResponse,
} from './api'

/**
 * Security-related types
 */
export type {
  AuthAttemptResult,
  MFAConfig,
  PermissionContext,
  PermissionLevel,
  ProjectPermissions,
  RateLimitConfig,
  RateLimitStatus,
  ResourcePermission,
  SecurityActivityType,
  SecurityAuditLog,
  SecurityConfig,
  SecurityEvent,
  SecurityEventDetails,
  SecuritySeverity,
  SessionInfo,
  TaskPermissions,
  UserSecurityProfile,
} from './security'

/**
 * Component prop types
 * Note: Component prop types are defined inline with their respective components
 * for better maintainability and co-location of types with implementation
 */

/**
 * Type for user preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: {
    email: boolean
    push: boolean
    inApp: boolean
  }
  dashboard: {
    layout: 'grid' | 'list'
    itemsPerPage: number
  }
}

/**
 * Type for error with additional context
 */
export interface AppError extends Error {
  code?: string
  context?: Record<string, any>
  timestamp?: Date
}

// Export enums as values
export { ActivityActionType } from './database'
