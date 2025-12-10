/**
 * @fileoverview UI utilities index - Main exports for UI functionality
 *
 * This module provides a centralized export point for all UI utilities,
 * making it easy to import UI functions throughout the application.
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

// Re-export all UI utilities
export * from './utils'

// Re-export UI styles and configurations
export * from './styles'

// Re-export UI constants
export * from './constants'

// Re-export UI-related types
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
} from '@/types/ui'
