/**
 * @fileoverview API-related type definitions for Team Sync application
 *
 * This module contains type definitions for API requests, responses,
 * and data transfer objects used in client-server communication.
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false
  error: string
  message?: string
  code?: string
  details?: Record<string, any>
  timestamp?: string
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Base API request parameters
 */
export interface BaseApiRequest {
  /** Request timestamp */
  timestamp?: string
  /** Request ID for tracking */
  requestId?: string
}

/**
 * Paginated request parameters
 */
export interface PaginatedRequest extends BaseApiRequest {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Search request parameters
 */
export interface SearchRequest extends PaginatedRequest {
  query: string
  filters?: Record<string, any>
}

// ============================================================================
// UPLOAD TYPES
// ============================================================================

/**
 * File upload request
 */
export interface FileUploadRequest extends BaseApiRequest {
  file: File
  fileName?: string
  description?: string
  tags?: string[]
}

/**
 * File upload response
 */
export interface FileUploadResponse extends ApiResponse {
  data: {
    fileId: string
    fileName: string
    fileSize: number
    mimeType: string
    url: string
    uploadedAt: string
  }
}

// ============================================================================
// BULK OPERATION TYPES
// ============================================================================

/**
 * Bulk operation request
 */
export interface BulkOperationRequest<T = any> extends BaseApiRequest {
  operation: 'create' | 'update' | 'delete'
  items: T[]
  options?: {
    validateOnly?: boolean
    continueOnError?: boolean
  }
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse<T = any> extends ApiResponse {
  data: {
    successful: T[]
    failed: Array<{
      item: T
      error: string
    }>
    summary: {
      total: number
      successful: number
      failed: number
    }
  }
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Data export request
 */
export interface ExportRequest extends BaseApiRequest {
  format: 'csv' | 'xlsx' | 'json' | 'pdf'
  filters?: Record<string, any>
  columns?: string[]
  dateRange?: {
    start: string
    end: string
  }
}

/**
 * Data export response
 */
export interface ExportResponse extends ApiResponse {
  data: {
    exportId: string
    downloadUrl: string
    fileName: string
    fileSize: number
    expiresAt: string
  }
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Webhook payload
 */
export interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, any>
  signature?: string
}

/**
 * Webhook response
 */
export interface WebhookResponse {
  received: boolean
  processed: boolean
  message?: string
}

// ============================================================================
// HEALTH CHECK TYPES
// ============================================================================

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    database: 'up' | 'down'
    storage: 'up' | 'down'
    auth: 'up' | 'down'
  }
  uptime: number
}

// ============================================================================
// RATE LIMITING TYPES
// ============================================================================

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

/**
 * Rate limited response
 */
export interface RateLimitedResponse extends ApiErrorResponse {
  rateLimit: RateLimitInfo
}
