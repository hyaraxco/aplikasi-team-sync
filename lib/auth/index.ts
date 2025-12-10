/**
 * @fileoverview Authentication and authorization index - Main exports for auth functionality
 *
 * This module provides a centralized export point for all authentication and
 * authorization operations, making it easy to import auth functions throughout the application.
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

// Re-export permission utilities
export * from './permissions'

// Re-export security utilities
export * from './security'

// Re-export security-related types
export type {
  SecurityActivityType,
  SecuritySeverity,
  SecurityEventDetails,
  SecurityEvent,
  SecurityAuditLog,
  PermissionLevel,
  ResourcePermission,
  PermissionContext,
  ProjectPermissions,
  TaskPermissions,
  SecurityConfig,
  UserSecurityProfile,
  RateLimitConfig,
  RateLimitStatus,
  AuthAttemptResult,
  SessionInfo,
  MFAConfig
} from '@/types/security'
