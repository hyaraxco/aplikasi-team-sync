/**
 * @fileoverview UI-related hooks index
 *
 * This module provides a centralized export point for all UI-related hooks,
 * including mobile detection, sidebar state, and toast notifications.
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

// Re-export UI hooks
export * from './use-mobile'
export * from './use-sidebar'
export * from './use-toast'

// Re-export UI-related types
export type { ToasterToast } from './use-toast'
