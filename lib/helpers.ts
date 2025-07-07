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
 *   createProject,
 *   AVAILABLE_TEAM_ROLES
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
 * Core utility functions
 *
 * @description Includes:
 * - `cn()` - Tailwind CSS class merging utility
 * - `formatRupiah()` - Indonesian currency formatting
 * - `formatDate()` - Date formatting with null handling
 * - `getStatusBadge()` - Project status badge configuration
 * - `getPriorityBadge()` - Project priority badge configuration
 * - Currency input parsing and formatting utilities
 */
export * from './utils';

/**
 * Activity message formatting utilities
 *
 * @description Functions for converting activity records into
 * human-readable messages for notifications and activity feeds.
 *
 * @example
 * ```typescript
 * const message = getActivityDisplayMessage(activity, "John Doe");
 * // Returns: "John Doe created project: New Website"
 * ```
 */
export * from './activity-formatter';

/**
 * Application constants and enums
 *
 * @description Includes:
 * - `AVAILABLE_TEAM_ROLES` - Available team member roles
 * - `MEMBER_STATUS` - Member status constants
 * - Type definitions for roles and statuses
 */
export * from './constants';

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
export { auth, db, secondaryAuth } from './firebase';

/**
 * Firestore type definitions
 *
 * @description Comprehensive TypeScript interfaces and enums for all
 * database entities used throughout the application.
 *
 * @example
 * ```typescript
 * import type { UserData, Project, Task } from '@/lib/helpers';
 *
 * const user: UserData = {
 *   id: 'user123',
 *   email: 'user@example.com',
 *   role: 'employee',
 *   // ... other properties
 * };
 * ```
 */
export type {
  /** User account data structure */
  UserData,
  /** User role enumeration: 'admin' | 'employee' */
  UserRole,
  /** Project data structure with status and priority */
  Project,
  /** Project status: 'planning' | 'in-progress' | 'completed' | 'on-hold' */
  ProjectStatus,
  /** Project priority: 'low' | 'medium' | 'high' */
  ProjectPriority,
  /** Task data structure with assignments and comments */
  Task,
  /** Task status: 'backlog' | 'in_progress' | 'completed' | 'revision' | 'done' | 'blocked' */
  TaskStatus,
  /** Task priority: 'low' | 'medium' | 'high' */
  TaskPriority,
  /** Team data structure with members and roles */
  Team,
  /** Team member data with role and status */
  TeamMember,
  /** Attendance record with check-in/out times */
  AttendanceRecord,
  /** Payroll record with earnings and status */
  Payroll,
  /** Payroll status: 'pending' | 'processing' | 'paid' | 'failed' */
  PayrollStatus,
  /** Activity log entry for audit trail */
  Activity,
  /** Activity type categorization */
  ActivityType,
  /** Earnings record for task/attendance compensation */
  Earning
} from './firestore';

/**
 * Firestore database operations
 *
 * @description Pre-configured database operation functions with proper
 * error handling, type safety, and role-based access control.
 *
 * @example
 * ```typescript
 * import { getUserData, createProject, getTasks } from '@/lib/helpers';
 *
 * // Fetch user data
 * const user = await getUserData(userId);
 *
 * // Create new project
 * const project = await createProject({
 *   name: "New Project",
 *   description: "Project description",
 *   // ... other fields
 * });
 *
 * // Get tasks with real-time updates
 * const tasks = await getTasks();
 * ```
 */
export {
  /** User management functions */
  getUserData,        // Fetch single user by ID
  getUsers,          // Fetch all users (admin only)
  createUserData,    // Create new user record
  updateUserData,    // Update existing user

  /** Project management functions */
  getProjects,       // Fetch all projects
  createProject,     // Create new project
  updateProject,     // Update existing project
  deleteProject,     // Delete project (admin only)

  /** Task management functions */
  getTasks,              // Fetch tasks with filtering
  createTask,            // Create new task
  updateTask,            // Update existing task
  submitTaskForReview,   // Submit task for admin review
  approveTask,           // Approve completed task
  requestTaskRevision,   // Request task revision
  getTeamTasks,          // Get tasks for specific team

  /** Team management functions */
  getTeams,          // Fetch all teams
  createTeam,        // Create new team
  updateTeam,        // Update team details
  deleteTeam,        // Delete team (admin only)

  /** Attendance tracking functions */
  getAttendanceRecords,  // Fetch attendance records
  checkIn,              // Record check-in time
  checkOut,             // Record check-out time

  /** Payroll management functions */
  getPayrollRecords,    // Fetch payroll data

  /** Activity logging functions */
  getRecentActivities,  // Fetch recent activity logs
  addActivity,          // Log new activity

  /** Earnings tracking functions */
  subscribeEarningsByUserId,  // Real-time earnings for user
  subscribeAllEarnings,       // Real-time all earnings (admin)

  /** Enums and constants */
  ActivityActionType,         // Activity action type enum
  Timestamp                   // Firestore Timestamp
} from './firestore';

/**
 * Notification UI configuration
 *
 * @description Provides consistent styling and iconography for different
 * activity types across notification components.
 *
 * @example
 * ```typescript
 * import { getNotificationTypeStyle } from '@/lib/helpers';
 *
 * const style = getNotificationTypeStyle('task');
 * // Returns: { icon: ClipboardList, dotColor: "bg-yellow-500", titlePrefix: "Task" }
 * ```
 */
export * from './notification-styles';
