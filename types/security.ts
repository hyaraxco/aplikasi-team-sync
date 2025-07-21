/**
 * @fileoverview Security-related type definitions for Team Sync application
 *
 * This module contains security-specific enums, interfaces, and types
 * used for security monitoring, logging, and access control.
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

// ============================================================================
// SECURITY ACTIVITY TYPES
// ============================================================================

/**
 * Security-specific activity types for monitoring and logging
 */
export enum SecurityActivityType {
  ADMIN_LOGIN = 'admin_login',
  ADMIN_ACTION = 'admin_action',
  FAILED_AUTH = 'failed_auth',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_EXPORT = 'data_export',
  BULK_OPERATION = 'bulk_operation',
  PERMISSION_CHANGE = 'permission_change',
  SECURITY_RULE_VIOLATION = 'security_rule_violation'
}

/**
 * Security event severity levels
 */
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ============================================================================
// SECURITY EVENT INTERFACES
// ============================================================================

/**
 * Security event details interface
 */
export interface SecurityEventDetails {
  action: string
  resource?: string
  targetUser?: string
  userAgent?: string
  timestamp?: string
  severity: SecuritySeverity
  metadata?: Record<string, any>
}

/**
 * Security event interface for logging security-related activities
 */
export interface SecurityEvent {
  id: string
  type: SecurityActivityType
  severity: SecuritySeverity
  userId?: string
  userEmail?: string
  userRole?: string
  timestamp: Date
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  resolved?: boolean
  resolvedBy?: string
  resolvedAt?: Date
}

/**
 * Security audit log entry
 */
export interface SecurityAuditLog {
  id: string
  event: SecurityEvent
  context: {
    sessionId?: string
    requestId?: string
    endpoint?: string
    method?: string
    statusCode?: number
  }
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

/**
 * Permission level enumeration
 */
export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin'
}

/**
 * Resource access permission interface
 */
export interface ResourcePermission {
  resourceType: string
  resourceId?: string
  permission: PermissionLevel
  grantedBy: string
  grantedAt: Date
  expiresAt?: Date
}

/**
 * Permission context for checking access rights
 */
export interface PermissionContext {
  userId: string
  userRole: string
  projectId?: string
  taskId?: string
  teamId?: string
}

/**
 * Project-specific permissions
 */
export interface ProjectPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canManageTeams: boolean
  canCreateTasks: boolean
  canCreateMilestones: boolean
  canAssignTasks: boolean
  canApproveTaskCompletion: boolean
}

/**
 * Task-specific permissions
 */
export interface TaskPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canAssign: boolean
  canComplete: boolean
  canComment: boolean
  canChangeStatus: boolean
}

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  maxLoginAttempts: number
  lockoutDuration: number
  sessionTimeout: number
  requireMFA: boolean
  allowedIpRanges?: string[]
  blockedIpAddresses?: string[]
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
  }
}

/**
 * User security profile interface
 */
export interface UserSecurityProfile {
  userId: string
  lastLogin?: Date
  lastPasswordChange?: Date
  failedLoginAttempts: number
  isLocked: boolean
  lockedUntil?: Date
  mfaEnabled: boolean
  permissions: ResourcePermission[]
  securityEvents: SecurityEvent[]
}

// ============================================================================
// RATE LIMITING TYPES
// ============================================================================

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  USER_CREATION: number
  BULK_OPERATIONS: number
  ADMIN_ACTIONS: number
  API_REQUESTS: number
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  action: string
  userId: string
  count: number
  limit: number
  windowStart: Date
  windowEnd: Date
  isLimited: boolean
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/**
 * Authentication attempt result
 */
export interface AuthAttemptResult {
  success: boolean
  userId?: string
  reason?: string
  lockoutUntil?: Date
  attemptsRemaining?: number
}

/**
 * Session information
 */
export interface SessionInfo {
  sessionId: string
  userId: string
  userRole: string
  createdAt: Date
  lastActivity: Date
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
}

/**
 * Multi-factor authentication configuration
 */
export interface MFAConfig {
  enabled: boolean
  method: 'totp' | 'sms' | 'email'
  backupCodes?: string[]
  lastUsed?: Date
}
