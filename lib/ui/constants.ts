/**
 * @fileoverview UI constants for Team Sync application
 *
 * This module contains UI-related constants, configuration values,
 * and default settings used throughout the application.
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

// ============================================================================
// MEMBER STATUS CONSTANTS
// ============================================================================

export const MEMBER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
} as const

export type MemberStatus = keyof typeof MEMBER_STATUS

// ============================================================================
// UI LAYOUT CONSTANTS
// ============================================================================

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const

/**
 * Sidebar configuration
 */
export const SIDEBAR_CONFIG = {
  COLLAPSED_WIDTH: 64,
  EXPANDED_WIDTH: 256,
  BREAKPOINT: 768, // md breakpoint
} as const

/**
 * Modal sizes
 */
export const MODAL_SIZES = {
  SM: 'max-w-sm',
  MD: 'max-w-md',
  LG: 'max-w-lg',
  XL: 'max-w-xl',
  '2XL': 'max-w-2xl',
  '3XL': 'max-w-3xl',
  '4XL': 'max-w-4xl',
  '5XL': 'max-w-5xl',
  '6XL': 'max-w-6xl',
  '7XL': 'max-w-7xl',
  FULL: 'max-w-full',
} as const

// ============================================================================
// FORM CONSTANTS
// ============================================================================

/**
 * Form validation messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, number, and special character',
  PHONE_INVALID: 'Please enter a valid phone number',
  URL_INVALID: 'Please enter a valid URL',
  DATE_INVALID: 'Please enter a valid date',
  NUMBER_INVALID: 'Please enter a valid number',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  MIN_VALUE: (min: number) => `Must be at least ${min}`,
  MAX_VALUE: (max: number) => `Must be no more than ${max}`,
} as const

/**
 * Input field limits
 */
export const INPUT_LIMITS = {
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  COMMENT_MAX_LENGTH: 1000,
  BIO_MAX_LENGTH: 250,
  TITLE_MAX_LENGTH: 200,
  EMAIL_MAX_LENGTH: 254,
  PHONE_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
} as const

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

/**
 * Animation durations in milliseconds
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const

/**
 * Transition classes for common animations
 */
export const TRANSITIONS = {
  DEFAULT: 'transition-all duration-300 ease-in-out',
  FAST: 'transition-all duration-150 ease-in-out',
  SLOW: 'transition-all duration-500 ease-in-out',
  OPACITY: 'transition-opacity duration-300 ease-in-out',
  TRANSFORM: 'transition-transform duration-300 ease-in-out',
  COLORS: 'transition-colors duration-300 ease-in-out',
} as const

// ============================================================================
// NOTIFICATION CONSTANTS
// ============================================================================

/**
 * Toast notification settings
 */
export const TOAST_CONFIG = {
  DEFAULT_DURATION: 4000,
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 6000,
  WARNING_DURATION: 5000,
  INFO_DURATION: 4000,
  MAX_TOASTS: 5,
} as const

/**
 * Notification panel settings
 */
export const NOTIFICATION_CONFIG = {
  MAX_ITEMS: 50,
  REFRESH_INTERVAL: 30000, // 30 seconds
  AUTO_MARK_READ_DELAY: 3000, // 3 seconds
} as const

// ============================================================================
// TABLE CONSTANTS
// ============================================================================

/**
 * Table configuration
 */
export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
  MAX_ROWS_PER_PAGE: 100,
  LOADING_ROWS: 5,
} as const

/**
 * Sort directions
 */
export const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
} as const

// ============================================================================
// THEME CONSTANTS
// ============================================================================

/**
 * Available themes
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

/**
 * Color palette for status indicators
 */
export const STATUS_COLORS = {
  SUCCESS: 'bg-green-500',
  ERROR: 'bg-red-500',
  WARNING: 'bg-yellow-500',
  INFO: 'bg-blue-500',
  NEUTRAL: 'bg-gray-500',
  PRIMARY: 'bg-primary',
  SECONDARY: 'bg-secondary',
} as const

// ============================================================================
// BREAKPOINT CONSTANTS
// ============================================================================

/**
 * Responsive breakpoints (matching Tailwind CSS)
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

// ============================================================================
// Z-INDEX CONSTANTS
// ============================================================================

/**
 * Z-index layers for proper stacking
 */
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
  LOADING: 1090,
} as const

// ============================================================================
// KEYBOARD CONSTANTS
// ============================================================================

/**
 * Common keyboard keys
 */
export const KEYS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
} as const

// ============================================================================
// FILE UPLOAD CONSTANTS
// ============================================================================

/**
 * File upload configuration
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const

// ============================================================================
// SEARCH CONSTANTS
// ============================================================================

/**
 * Search configuration
 */
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 50,
  HIGHLIGHT_CLASS: 'bg-yellow-200 dark:bg-yellow-800',
} as const
