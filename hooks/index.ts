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

/**
 * Hook for detecting mobile breakpoints and responsive behavior
 *
 * @description Provides real-time detection of mobile screen sizes using
 * window.matchMedia API with a 768px breakpoint threshold.
 *
 * @returns {boolean} True if current viewport is mobile size (< 768px)
 *
 * @example
 * ```typescript
 * const isMobile = useIsMobile();
 * return isMobile ? <MobileLayout /> : <DesktopLayout />;
 * ```
 */
export { useIsMobile } from './use-mobile'

/**
 * Sidebar state management hook and provider
 *
 * @description Manages global sidebar open/close state with automatic
 * route-based closing on mobile devices.
 *
 * @example

export { useSidebar, SidebarProvider } from './use-sidebar';

/**
 * Toast notification system hook and utilities
 *
 * @description Provides toast notification functionality with queue management,
 * auto-dismiss, and customizable styling options.
 *
 * @example
 * ```typescript
 * const { toast } = useToast();
 *
 * toast({
 *   title: "Success",
 *   description: "Operation completed successfully",
 *   variant: "default"
 * });
 * ```
 */
export { toast, useToast } from './use-toast'

/**
 * Real-time earnings data subscription hook
 *
 * @description Subscribes to real-time earnings updates from Firestore.
 * Automatically handles role-based access (admin sees all, employee sees own).
 *
 * @returns {Earning[]} Array of earnings records with real-time updates
 *
 * @example
 * ```typescript
 * const earnings = useEarnings();
 * const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
 * ```
 */
export { useEarnings } from './use-earnings'

/**
 * User permission checking hook
 *
 * @description Provides role-based permission checking utilities based on
 * current user's authentication role.
 *
 * @returns {Object} Permission flags and role checking functions
 *
 * @example
 * ```typescript
 * const { isAdmin, canManageUsers, canViewReports } = usePermission();
 *
 * if (canManageUsers) {
 *   return <UserManagementPanel />;
 * }
 * ```
 */
export { usePermission } from './use-permission'

/**
 * Type definitions for toast notifications
 *
 * @description TypeScript type for toast configuration objects
 */
export type { ToasterToast } from './use-toast'
