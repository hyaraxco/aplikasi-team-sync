/**
 * @fileoverview Centralized exports for all custom React hooks
 *
 * This module provides a single entry point for importing all custom hooks
 * throughout the application, promoting consistency and easier maintenance.
 *
 * @example
 * ```typescript
 * // Import multiple hooks from single entry point
 * import { useIsMobile, useToast, usePermission } from '@/hooks';
 *
 * // Use in component
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   const { toast } = useToast();
 *   const { isAdmin } = usePermission();
 *   // ...
 * }
 * ```
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

// ============================================================================
// ORGANIZED EXPORTS FROM NEW STRUCTURE
// ============================================================================

/**
 * UI-related hooks (mobile detection, sidebar, toast)
 */
export * from './ui'

/**
 * Data-related hooks (earnings, real-time subscriptions)
 */
export * from './data'

/**
 * Authentication and authorization hooks
 */
export * from './auth'

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Direct exports for backward compatibility
 * These maintain existing import patterns while using the new structure
 */

// UI hooks
export { useIsMobile } from './ui/use-mobile'
export { SidebarProvider, useSidebar } from './ui/use-sidebar'
export { toast, useToast } from './ui/use-toast'

// Data hooks
export { useEarnings } from './data/use-earnings'

// Auth hooks
export { usePermission } from './auth/use-permission'

// Types
export type { ToasterToast } from './ui/use-toast'
