/**
 * Unified Permission System for Team Sync Application
 *
 * This module provides both global and context-aware permission checking
 * through React hooks and utility functions.
 */

import { useAuth } from '@/components/auth-provider'
import { getProjectById, getTeamById } from '@/lib/database'
import type { Task, Team } from '@/types'
import { useCallback, useMemo } from 'react'

// Re-export types and functions from lib/auth for backward compatibility
export type { PermissionContext, ProjectPermissions, TaskPermissions } from '@/lib/auth'

export {
  canTransitionProjectStatus,
  getProjectPermissions,
  getTaskPermissions,
  validateMilestoneOperation,
  validateTaskAssignment,
} from '@/lib/auth'

/**
 * Global permission interface for application-wide features
 */
export interface GlobalPermissions {
  isAdmin: boolean
  isEmployee: boolean
  canViewReports: boolean
  canManageUsers: boolean
  canAccessSettings: boolean
  canCreateProjects: boolean
  canManageTeams: boolean
  canViewAllProjects: boolean
  canAccessAdminPanel: boolean
}

/**
 * Hook for global application permissions
 *
 * @returns Global permission flags based on user role
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
export function usePermission(): GlobalPermissions {
  const { userRole } = useAuth()

  return useMemo(
    () => ({
      isAdmin: userRole === 'admin',
      isEmployee: userRole === 'employee',
      canViewReports: userRole === 'admin',
      canManageUsers: userRole === 'admin',
      canAccessSettings: true, // All roles can access settings, content controlled at page level
      canCreateProjects: userRole === 'admin', // Only admins can create projects
      canManageTeams: userRole === 'admin', // Only admins can manage teams
      canViewAllProjects: userRole === 'admin', // Admins see all projects, employees see assigned ones
      canAccessAdminPanel: userRole === 'admin',
    }),
    [userRole]
  )
}

/**
 * Hook for project-specific permissions with automatic data fetching
 *
 * @param projectId - The project ID to check permissions for
 * @returns Project permissions and loading state
 *
 * @example
 * ```typescript
 * const { permissions, loading, error } = useProjectPermissions(projectId);
 *
 * if (permissions.canCreateMilestones) {
 *   return <AddMilestoneButton />;
 * }
 * ```
 */
export function useProjectPermissions(projectId: string) {
  const { user, userRole } = useAuth()

  const fetchPermissions = useCallback(async () => {
    if (!user || !userRole) {
      return {
        permissions: null,
        project: null,
        userTeams: [],
        error: 'User not authenticated',
      }
    }

    try {
      // Fetch project data
      const project = await getProjectById(projectId)
      if (!project) {
        return {
          permissions: null,
          project: null,
          userTeams: [],
          error: 'Project not found',
        }
      }

      // Fetch user teams
      const teamPromises = project.teams.map(teamId => getTeamById(teamId))
      const teams = await Promise.all(teamPromises)
      const userTeams = teams.filter(team => team !== null) as Team[]

      // Calculate permissions using the business logic functions
      const { getProjectPermissions } = await import('@/lib/auth')
      const permissions = getProjectPermissions(
        { userId: user.uid, userRole, projectId },
        project,
        userTeams
      )

      return {
        permissions,
        project,
        userTeams,
        error: null,
      }
    } catch (error) {
      console.error('Error fetching project permissions:', error)
      return {
        permissions: null,
        project: null,
        userTeams: [],
        error: 'Failed to load permissions',
      }
    }
  }, [projectId, user, userRole])

  return { fetchPermissions }
}

/**
 * Hook for task-specific permissions
 *
 * @param taskId - The task ID to check permissions for
 * @param projectId - The project ID the task belongs to
 * @returns Task permissions and loading state
 *
 * @example
 * ```typescript
 * const { permissions, loading } = useTaskPermissions(taskId, projectId);
 *
 * if (permissions.canEdit) {
 *   return <EditTaskButton />;
 * }
 * ```
 */
export function useTaskPermissions(taskId: string, projectId: string) {
  const { user, userRole } = useAuth()

  const fetchPermissions = useCallback(
    async (task: Task) => {
      if (!user || !userRole) {
        return {
          permissions: null,
          error: 'User not authenticated',
        }
      }

      try {
        // Fetch project data
        const project = await getProjectById(projectId)
        if (!project) {
          return {
            permissions: null,
            error: 'Project not found',
          }
        }

        // Fetch user teams
        const teamPromises = project.teams.map(teamId => getTeamById(teamId))
        const teams = await Promise.all(teamPromises)
        const userTeams = teams.filter(team => team !== null) as Team[]

        // Calculate permissions
        const { getTaskPermissions } = await import('@/lib/auth')
        const permissions = getTaskPermissions(
          { userId: user.uid, userRole, projectId, taskId },
          task,
          project,
          userTeams
        )

        return {
          permissions,
          error: null,
        }
      } catch (error) {
        console.error('Error fetching task permissions:', error)
        return {
          permissions: null,
          error: 'Failed to load permissions',
        }
      }
    },
    [taskId, projectId, user, userRole]
  )

  return { fetchPermissions }
}

/**
 * Comprehensive permission hook that provides both global and context-aware permissions
 *
 * @param options - Configuration for context-aware permissions
 * @returns Combined permission object with global and context-specific permissions
 *
 * @example
 * ```typescript
 * // Global permissions only
 * const { global } = usePermissions();
 *
 * // With project context
 * const { global, project } = usePermissions({ projectId: 'project-123' });
 *
 * // With task context
 * const { global, task } = usePermissions({
 *   projectId: 'project-123',
 *   taskId: 'task-456'
 * });
 * ```
 */
export function usePermissions(options?: { projectId?: string; taskId?: string; task?: Task }) {
  const globalPermissions = usePermission()
  const { user, userRole } = useAuth()

  // Project permissions hook
  const projectPermissionsHook = useProjectPermissions(options?.projectId || '')

  // Task permissions hook
  const taskPermissionsHook = useTaskPermissions(options?.taskId || '', options?.projectId || '')

  /**
   * Get project permissions for a specific project
   */
  const getProjectPerms = useCallback(
    async (projectId: string) => {
      if (!projectId) return null
      const result = await projectPermissionsHook.fetchPermissions()
      return result
    },
    [projectPermissionsHook]
  )

  /**
   * Get task permissions for a specific task
   */
  const getTaskPerms = useCallback(
    async (task: Task, projectId: string) => {
      if (!task || !projectId) return null
      const result = await taskPermissionsHook.fetchPermissions(task)
      return result
    },
    [taskPermissionsHook]
  )

  /**
   * Check if user can perform a specific action
   */
  const can = useCallback(
    (action: string, context?: any) => {
      // Global actions
      switch (action) {
        case 'viewReports':
          return globalPermissions.canViewReports
        case 'manageUsers':
          return globalPermissions.canManageUsers
        case 'createProjects':
          return globalPermissions.canCreateProjects
        case 'manageTeams':
          return globalPermissions.canManageTeams
        case 'accessAdminPanel':
          return globalPermissions.canAccessAdminPanel
        default:
          // For context-specific actions, return false if no context provided
          return false
      }
    },
    [globalPermissions]
  )

  /**
   * Validate business rules for operations
   */
  const validateOperation = useCallback(
    async (
      operation: 'createMilestone' | 'editMilestone' | 'assignTask' | 'transitionProject',
      context: any
    ) => {
      if (!user || !userRole) {
        return { valid: false, reason: 'User not authenticated' }
      }

      try {
        const { validateMilestoneOperation, validateTaskAssignment, canTransitionProjectStatus } =
          await import('@/lib/auth')

        switch (operation) {
          case 'createMilestone':
          case 'editMilestone':
            if (!context.milestone || !context.project) {
              return { valid: false, reason: 'Missing milestone or project data' }
            }
            return validateMilestoneOperation(context.milestone, context.project, {
              userId: user.uid,
              userRole,
              projectId: context.project.id,
            })

          case 'assignTask':
            if (!context.task || !context.assigneeId || !context.project || !context.userTeams) {
              return { valid: false, reason: 'Missing task assignment data' }
            }
            return validateTaskAssignment(
              context.task,
              context.assigneeId,
              context.project,
              context.userTeams
            )

          case 'transitionProject':
            if (!context.currentStatus || !context.newStatus || !context.project) {
              return { valid: false, reason: 'Missing project transition data' }
            }
            return canTransitionProjectStatus(
              context.currentStatus,
              context.newStatus,
              { userId: user.uid, userRole, projectId: context.project.id },
              context.project
            )

          default:
            return { valid: false, reason: 'Unknown operation' }
        }
      } catch (error) {
        console.error('Error validating operation:', error)
        return { valid: false, reason: 'Validation failed' }
      }
    },
    [user, userRole]
  )

  return {
    global: globalPermissions,
    getProjectPermissions: getProjectPerms,
    getTaskPermissions: getTaskPerms,
    can,
    validateOperation,
    user,
    userRole,
  }
}
