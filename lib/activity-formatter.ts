import { type Activity as BaseActivity, ActivityActionType } from "./firestore";

// Extend Activity type to explicitly allow string actions for legacy support
interface Activity extends Omit<BaseActivity, 'action'> {
  action: ActivityActionType | string;
}

/**
 * Formats an activity record into a human-readable message
 * @param activity The activity record to format
 * @param actorName The display name of the actor who performed the activity
 * @returns A formatted string describing the activity
 */
export function getActivityDisplayMessage(activity: Activity, actorName: string): string {
  const target = activity.targetName || (activity.targetId ? `ID: ${activity.targetId.substring(0, 6)}` : 'an item');
  const details = activity.details || {};

  // First check if action is an ActivityActionType
  if (Object.values(ActivityActionType).includes(activity.action as ActivityActionType)) {
    switch (activity.action as ActivityActionType) {
      // Project Actions
      case ActivityActionType.PROJECT_CREATED:
        return `${actorName} created project: ${target}`;
      case ActivityActionType.PROJECT_UPDATED:
        return `${actorName} updated project: ${target}`;
      case ActivityActionType.PROJECT_DELETED:
        return `${actorName} deleted project: ${target}`;

      // Task Actions
      case ActivityActionType.TASK_CREATED:
        return `${actorName} created task: ${target}`;
      case ActivityActionType.TASK_UPDATED:
        return `${actorName} updated task: ${target}`;
      case ActivityActionType.TASK_COMPLETED:
        return `${actorName} completed task: ${target}`;
      case ActivityActionType.TASK_ASSIGNED:
        return `${actorName} assigned task ${target} to ${details.assignedToName || 'someone'}`;
      case ActivityActionType.TASK_STATUS_CHANGED:
        return `${actorName} changed status of task ${target} to ${details.newStatus || 'a new status'}`;

      // Team Actions
      case ActivityActionType.TEAM_CREATED:
        return `${actorName} created team: ${target}`;
      case ActivityActionType.TEAM_UPDATED:
        return `${actorName} updated team: ${target}`;
      case ActivityActionType.TEAM_DELETED:
        return `${actorName} deleted team: ${target}`;
      case ActivityActionType.TEAM_MEMBER_ADDED:
        return `${actorName} added ${details.addedMemberName || 'a new member'} to ${target}`;
      case ActivityActionType.TEAM_MEMBER_REMOVED:
        return `${actorName} removed ${details.memberName || 'a member'} from ${target}`;
      case ActivityActionType.TEAM_MEMBER_ROLE_UPDATED:
        return `${actorName} updated role for ${details.memberName || 'a member'} in ${target}`;
      case ActivityActionType.TEAM_MEMBER_STATUS_UPDATED:
        return `${actorName} updated status for ${details.memberName || 'a member'} in ${target}`;
      case ActivityActionType.TEAM_MEMBER_DETAILS_UPDATED:
        return `${actorName} updated details for ${target} in ${details.teamName}`;
      case ActivityActionType.TEAM_LEAD_CHANGED:
        return `${actorName} changed lead of ${target} to ${details.newLeadName || 'a new lead'}`;

      // Attendance Actions
      case ActivityActionType.ATTENDANCE_CHECK_IN:
        return `${actorName} checked in`;
      case ActivityActionType.ATTENDANCE_CHECK_OUT:
        return `${actorName} checked out`;
      case ActivityActionType.ATTENDANCE_RECORD_UPDATED:
        return `${actorName} updated attendance record`;

      // Payroll Actions
      case ActivityActionType.PAYROLL_GENERATED:
        return `${actorName} generated payroll for ${details.period || 'a period'}`;
      case ActivityActionType.PAYROLL_STATUS_UPDATED:
        return `${actorName} updated payroll status to ${details.newStatus || 'a new status'}`;

      // User Profile Actions
      case ActivityActionType.USER_PROFILE_UPDATED:
        return `${actorName} updated employee ${target}`;
      case ActivityActionType.USER_CREATED:
        return `${actorName} created new employee ${target}`;
      case ActivityActionType.USER_UPDATED:
        return `${actorName} updated employee ${target}`;
      case ActivityActionType.USER_DEACTIVATED:
        return `${actorName} deactivated employee ${target}`;
      case ActivityActionType.USER_ACTIVATED:
        return `${actorName} activated employee ${target}`;
      case ActivityActionType.USER_REACTIVATED:
        return `${actorName} reactivated employee ${target}`;
      case ActivityActionType.AUTH_ROLE_CHANGE:
        return `${actorName} changed role to ${details.newRole || 'a new role'}`;
    

      // Authentication Actions
      case ActivityActionType.AUTH_LOGIN:
        return `${actorName} logged in`;
      case ActivityActionType.AUTH_LOGOUT:
        return `${actorName} logged out`;
      case ActivityActionType.AUTH_PASSWORD_CHANGE:
        return `${actorName} changed password`;
      case ActivityActionType.USER_REGISTERED_PENDING_APPROVAL:
        return `${actorName} registered and is pending approval`;
    }
  }

  // Handle legacy string-based actions or unknown actions
  if (typeof activity.action === 'string') {
    // Legacy string action handling
    if (activity.action.includes(' ')) {
      let message = activity.action;
      if (activity.targetName) {
        message += ` ${activity.targetName}`;
      }
      return `${actorName} ${message}`;
    }
    // Single word action
    return `${actorName} ${activity.action} ${target}`;
  }

  // Fallback for truly unknown action types
  return `${actorName} performed an action on ${target}`;
}