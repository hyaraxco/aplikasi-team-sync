/**
 * Enhanced Permission System for Project Management
 *
 * This module provides granular permission checking for project management operations
 * based on user roles, project membership, and business rules.
 */

import type {
  PermissionContext,
  Project,
  ProjectPermissions,
  Task,
  TaskPermissions,
  Team,
} from '@/types'

// Re-export types for backward compatibility
export type { PermissionContext, ProjectPermissions, TaskPermissions }

/**
 * Check if user has permission to perform project operations
 */
export function getProjectPermissions(
  context: PermissionContext,
  project: Project,
  userTeams: Team[] = []
): ProjectPermissions {
  const { userId, userRole } = context

  // Admin has all permissions
  if (userRole === 'admin') {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canManageTeams: true,
      canCreateTasks: true,
      canCreateMilestones: true,
      canAssignTasks: true,
      canApproveTaskCompletion: true,
    }
  }

  // Check if user is project creator
  const isCreator = project.createdBy === userId

  // Check if user is project manager
  const isProjectManager = project.projectManager?.userId === userId

  // Check if user is in project teams
  const isTeamMember = userTeams.some(
    team => project.teams.includes(team.id) && team.members.some(member => member.userId === userId)
  )

  // Check if user is team leader of any project team
  const isTeamLeader = userTeams.some(
    team => project.teams.includes(team.id) && team.lead?.userId === userId
  )

  // Base permissions for employees
  const basePermissions: ProjectPermissions = {
    canView: isTeamMember || isCreator || isProjectManager,
    canEdit: isCreator || isProjectManager || isTeamLeader,
    canDelete: false, // Only admins can delete projects
    canManageTeams: isCreator || isProjectManager,
    canCreateTasks: isTeamMember || isCreator || isProjectManager,
    canCreateMilestones: isProjectManager || isTeamLeader,
    canAssignTasks: isProjectManager || isTeamLeader,
    canApproveTaskCompletion: isProjectManager || isTeamLeader,
  }

  return basePermissions
}

/**
 * Check if user has permission to perform task operations
 */
export function getTaskPermissions(
  context: PermissionContext,
  task: Task,
  project: Project,
  userTeams: Team[] = []
): TaskPermissions {
  const { userId, userRole } = context

  // Admin has all permissions
  if (userRole === 'admin') {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canAssign: true,
      canComplete: true,
      canComment: true,
      canChangeStatus: true,
    }
  }

  // Check if user is assigned to task
  const isAssigned = task.assignedTo?.includes(userId) || false

  // Check if user is task creator
  const isCreator = task.createdBy === userId

  // Get project permissions
  const projectPerms = getProjectPermissions(context, project, userTeams)

  // Check if user is project manager
  const isProjectManager = project.projectManager?.userId === userId

  // Check if user is team leader of task's team
  const isTeamLeader = task.teamId
    ? userTeams.some(team => team.id === task.teamId && team.lead?.userId === userId)
    : false

  return {
    canView: projectPerms.canView,
    canEdit: isAssigned || isCreator || isProjectManager || isTeamLeader,
    canDelete: isCreator || isProjectManager || isTeamLeader,
    canAssign: projectPerms.canAssignTasks,
    canComplete: isAssigned || isProjectManager || isTeamLeader,
    canComment: projectPerms.canView,
    canChangeStatus: isAssigned || isProjectManager || isTeamLeader,
  }
}

/**
 * Validate project status transitions
 */
export function canTransitionProjectStatus(
  currentStatus: string,
  newStatus: string,
  context: PermissionContext,
  project: Project
): { allowed: boolean; reason?: string } {
  // Define valid status transitions
  const validTransitions: Record<string, string[]> = {
    planning: ['in-progress', 'on-hold'],
    'in-progress': ['completed', 'on-hold'],
    'on-hold': ['in-progress', 'planning'],
    completed: [], // Completed projects cannot be changed (except by admin)
  }

  // Admins can make any transition
  if (context.userRole === 'admin') {
    return { allowed: true }
  }

  // Check if transition is valid
  const allowedNextStatuses = validTransitions[currentStatus] || []
  if (!allowedNextStatuses.includes(newStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition from ${currentStatus} to ${newStatus}`,
    }
  }

  // Check if user has permission to edit project
  const projectPerms = getProjectPermissions(context, project)
  if (!projectPerms.canEdit) {
    return {
      allowed: false,
      reason: 'You do not have permission to change project status',
    }
  }

  return { allowed: true }
}

/**
 * Validate business rules for task assignment
 */
export function validateTaskAssignment(
  task: Task,
  assigneeId: string,
  project: Project,
  userTeams: Team[]
): { valid: boolean; reason?: string } {
  // Check if assignee is member of project teams
  const isProjectMember = userTeams.some(
    team =>
      project.teams.includes(team.id) && team.members.some(member => member.userId === assigneeId)
  )

  if (!isProjectMember) {
    return {
      valid: false,
      reason: 'User must be a member of project teams to be assigned tasks',
    }
  }

  // Check if project is in a state that allows task assignment
  if (project.status === 'completed') {
    return {
      valid: false,
      reason: 'Cannot assign tasks to completed projects',
    }
  }

  // Check if task deadline is after project start and before project deadline
  if (task.deadline.toDate() > project.deadline.toDate()) {
    return {
      valid: false,
      reason: 'Task deadline cannot be after project deadline',
    }
  }

  return { valid: true }
}

/**
 * Check if milestone can be created/edited based on business rules
 */
export function validateMilestoneOperation(
  milestone: { dueDate: any; status?: string },
  project: Project,
  context: PermissionContext
): { valid: boolean; reason?: string } {
  // Check permissions
  const projectPerms = getProjectPermissions(context, project)
  if (!projectPerms.canCreateMilestones) {
    return {
      valid: false,
      reason: 'You do not have permission to manage milestones',
    }
  }

  // Check if project allows milestone creation
  if (project.status === 'completed') {
    return {
      valid: false,
      reason: 'Cannot create milestones for completed projects',
    }
  }

  // Check if milestone due date is reasonable
  if (milestone.dueDate.toDate() > project.deadline.toDate()) {
    return {
      valid: false,
      reason: 'Milestone due date cannot be after project deadline',
    }
  }

  if (milestone.dueDate.toDate() < project.createdAt.toDate()) {
    return {
      valid: false,
      reason: 'Milestone due date cannot be before project start date',
    }
  }

  return { valid: true }
}
