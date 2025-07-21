/**
 * Security utilities for Team Sync application
 * Provides logging, monitoring, and security event tracking
 */

import { serverTimestamp } from 'firebase/firestore'
import { addActivity } from '../database/firestore'

// Re-export security types from centralized location
export type {
  AuthAttemptResult,
  MFAConfig,
  RateLimitConfig,
  RateLimitStatus,
  SecurityActivityType,
  SecurityAuditLog,
  SecurityConfig,
  SecurityEvent,
  SecurityEventDetails,
  SecuritySeverity,
  SessionInfo,
  UserSecurityProfile,
} from '@/types/security'

// Import enums as values, not types
import type { SecurityEventDetails } from '@/types/security'
import { SecurityActivityType, SecuritySeverity } from '@/types/security'

/**
 * Log security events for monitoring and audit purposes
 */
export async function logSecurityEvent(
  type: SecurityActivityType,
  details: SecurityEventDetails,
  userId?: string
): Promise<void> {
  try {
    const eventData = {
      userId: userId || 'system',
      type: 'security' as const,
      action: type as any, // Cast to match ActivityActionType
      timestamp: serverTimestamp(),
      details: {
        ...details,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString(),
        severity: details.severity,
        securityEvent: true, // Flag to identify security events
      },
    }

    await addActivity(eventData)

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Security Event:', {
        type,
        severity: details.severity,
        action: details.action,
        userId,
      })
    }

    // In production, you might want to send critical events to external monitoring
    if (details.severity === SecuritySeverity.CRITICAL) {
      await handleCriticalSecurityEvent(type, details, userId)
    }
  } catch (error) {
    console.error('Failed to log security event:', error)
    // Don't throw - security logging shouldn't break app functionality
  }
}

/**
 * Handle critical security events that require immediate attention
 */
async function handleCriticalSecurityEvent(
  type: SecurityActivityType,
  details: SecurityEventDetails,
  userId?: string
): Promise<void> {
  // In a production environment, you would:
  // 1. Send alerts to security team
  // 2. Trigger automated responses
  // 3. Log to external security monitoring systems

  console.error('🚨 CRITICAL SECURITY EVENT:', {
    type,
    details,
    userId,
    timestamp: new Date().toISOString(),
  })

  // Example: Send to external monitoring service
  // await sendToSecurityMonitoring({ type, details, userId })
}

/**
 * Monitor admin actions and log them for audit purposes
 */
export function withSecurityLogging<T extends any[], R>(
  action: string,
  severity: SecuritySeverity = SecuritySeverity.MEDIUM
) {
  return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: T): Promise<R> {
      const userId = 'system' // Default to system since we can't access this.userId in decorator

      try {
        // Log the action start
        await logSecurityEvent(
          SecurityActivityType.ADMIN_ACTION,
          {
            action: `${action}_start`,
            resource: propertyKey,
            severity,
            metadata: { args: args.length },
          },
          userId
        )

        const result = await originalMethod.apply(this, args)

        // Log successful completion
        await logSecurityEvent(
          SecurityActivityType.ADMIN_ACTION,
          {
            action: `${action}_success`,
            resource: propertyKey,
            severity,
            metadata: { success: true },
          },
          userId
        )

        return result
      } catch (error) {
        // Log the error
        await logSecurityEvent(
          SecurityActivityType.ADMIN_ACTION,
          {
            action: `${action}_error`,
            resource: propertyKey,
            severity: SecuritySeverity.HIGH,
            metadata: {
              error: error instanceof Error ? error.message : 'Unknown error',
              success: false,
            },
          },
          userId
        )

        throw error
      }
    }

    return descriptor
  }
}

/**
 * Validate user permissions and log violations
 */
export async function validateAndLogPermission(
  userId: string,
  requiredRole: string,
  action: string,
  resource?: string
): Promise<boolean> {
  // This would integrate with your existing auth system
  // For now, it's a placeholder that logs the permission check

  await logSecurityEvent(
    SecurityActivityType.PERMISSION_CHANGE,
    {
      action: 'permission_check',
      resource,
      severity: SecuritySeverity.LOW,
      metadata: {
        requiredRole,
        action,
        resource,
      },
    },
    userId
  )

  return true // Placeholder - implement actual permission check
}

/**
 * Security configuration and constants
 */
export const SECURITY_CONFIG = {
  // Maximum failed login attempts before lockout
  MAX_FAILED_ATTEMPTS: 5,

  // Session timeout in milliseconds (24 hours)
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,

  // Rate limiting for sensitive operations
  RATE_LIMITS: {
    USER_CREATION: 10, // per hour
    BULK_OPERATIONS: 5, // per hour
    ADMIN_ACTIONS: 50, // per hour
  },

  // Security event retention (days)
  EVENT_RETENTION_DAYS: 90,
}

/**
 * Check if an action should be rate limited
 */
export function shouldRateLimit(
  _action: string,
  _userId: string,
  _timeWindow: number = 3600000 // 1 hour in ms
): boolean {
  // Implement rate limiting logic here
  // This is a placeholder implementation
  return false
}

/**
 * Sanitize sensitive data for logging
 */
export function sanitizeForLogging(data: any): any {
  const sensitiveFields = ['password', 'token', 'key', 'secret', 'private']

  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sanitized = { ...data }

  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key])
    }
  }

  return sanitized
}
