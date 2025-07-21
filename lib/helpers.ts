/**
 * @fileoverview Consolidated helper functions and utilities
 *
 * This module provides a centralized entry point for all utility functions,
 * constants, and commonly used Firebase/Firestore operations. It promotes
 * code reusability and maintains a clean separation of concerns.
 *
 * @example
 * ```typescript
 * // Import utilities from single entry point
 * import {
 *   formatRupiah,
 *   cn,
 *   getStatusBadge,
 *   UserData,
 *   createProject
 * } from '@/lib/helpers';
 *
 * // Use in component
 * const formattedPrice = formatRupiah(150000);
 * const className = cn('base-class', conditionalClass);
 * ```
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

/**
 * UI utilities, styling, and constants
 */
export * from './ui'

/**
 * Database operations and utilities
 */
export * from './database'

/**
 * Authentication and authorization utilities
 */
export * from './auth'

/**
 * Global constants are now organized in specific modules:
 * - UI constants: './ui/constants'
 * - Database constants: './database' (if any)
 * - Auth constants: './auth' (if any)
 */

/**
 * Firebase configuration and instances
 *
 * @description Pre-configured Firebase app instances for authentication
 * and database operations. Includes secondary auth for admin operations.
 *
 * @example
 * ```typescript
 * import { auth, db } from '@/lib/helpers';
 *
 * const user = auth.currentUser;
 * const docRef = doc(db, 'users', userId);
 * ```
 */
export { auth, db, secondaryAuth } from './firebase'
