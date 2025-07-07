/**
 * @fileoverview Notification type styles and utilities
 *
 * This module provides consistent styling configuration for different activity
 * types across notification components. It centralizes icon selection, color
 * schemes, and title prefixes for better maintainability.
 *
 * @example
 * ```typescript
 * import { getNotificationTypeStyle, notificationTypeStyles } from '@/lib/notification-styles';
 *
 * // Get style for specific activity type
 * const taskStyle = getNotificationTypeStyle('task');
 * const { icon: IconComponent, dotColor, titlePrefix } = taskStyle;
 *
 * // Use in component
 * <IconComponent className="h-5 w-5" />
 * <span className={dotColor}>•</span>
 * ```
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

import type React from 'react';
import {
  ClipboardList,
  DollarSign,
  Briefcase,
  Users,
  Clock,
  UserCircle,
  AlertCircle,
  KeyRound,
  Coins,
} from 'lucide-react';
import type { ActivityType } from './firestore';

/**
 * Configuration interface for notification type styling
 */
export interface NotificationTypeStyle {
  /** React component for the icon */
  icon: React.ElementType;
  /** Tailwind CSS class for dot color */
  dotColor: string;
  /** Optional title prefix for the notification */
  titlePrefix?: string;
}

/**
 * Comprehensive mapping of activity types to their visual styles
 *
 * @description Provides consistent iconography and color coding across
 * all notification components. Each activity type has:
 * - A specific Lucide React icon
 * - A Tailwind CSS background color class for status dots
 * - An optional title prefix for display
 */
export const notificationTypeStyles: Record<
  ActivityType | "default",
  NotificationTypeStyle
> = {
  /** Task-related activities */
  task: {
    icon: ClipboardList,
    dotColor: "bg-yellow-500",
    titlePrefix: "Task"
  },

  /** Payroll and compensation activities */
  payroll: {
    icon: DollarSign,
    dotColor: "bg-blue-500",
    titlePrefix: "Payroll"
  },

  /** Project management activities */
  project: {
    icon: Briefcase,
    dotColor: "bg-green-500",
    titlePrefix: "Project"
  },

  /** Team collaboration activities */
  team: {
    icon: Users,
    dotColor: "bg-purple-500",
    titlePrefix: "Team"
  },

  /** Attendance and time tracking activities */
  attendance: {
    icon: Clock,
    dotColor: "bg-orange-500",
    titlePrefix: "Attendance"
  },

  /** User account and profile activities */
  user: {
    icon: UserCircle,
    dotColor: "bg-indigo-500",
    titlePrefix: "User"
  },

  /** Authentication and security activities */
  auth: {
    icon: KeyRound,
    dotColor: "bg-cyan-500",
    titlePrefix: "Auth"
  },

  /** Earnings and financial activities */
  earning: {
    icon: Coins,
    dotColor: "bg-emerald-500",
    titlePrefix: "Earning"
  },

  /** Default fallback for unknown activity types */
  default: {
    icon: AlertCircle,
    dotColor: "bg-gray-500",
    titlePrefix: "Notification"
  },
};

/**
 * Get notification style configuration for a specific activity type
 *
 * @param activityType - The activity type to get styles for
 * @returns Style configuration object with icon, color, and title prefix
 *
 * @example
 * ```typescript
 * const taskStyle = getNotificationTypeStyle('task');
 * const unknownStyle = getNotificationTypeStyle('unknown' as ActivityType);
 * // unknownStyle will return the default style
 * ```
 */
export function getNotificationTypeStyle(
  activityType: ActivityType | string
): NotificationTypeStyle {
  return notificationTypeStyles[activityType as ActivityType] || notificationTypeStyles.default;
}

/**
 * Get all available activity types with their style configurations
 *
 * @returns Array of objects containing activity type and its style configuration
 *
 * @example
 * ```typescript
 * const allStyles = getAllNotificationTypeStyles();
 * // Returns: [{ type: 'task', style: { icon: ClipboardList, ... } }, ...]
 * ```
 */
export function getAllNotificationTypeStyles(): Array<{
  type: ActivityType | "default";
  style: NotificationTypeStyle;
}> {
  return Object.entries(notificationTypeStyles).map(([type, style]) => ({
    type: type as ActivityType | "default",
    style,
  }));
}

/**
 * Get only the dot colors for use in filtering or legend components
 *
 * @returns Record mapping activity types to their dot color classes
 *
 * @example
 * ```typescript
 * const colors = getNotificationDotColors();
 * // Returns: { task: "bg-yellow-500", payroll: "bg-blue-500", ... }
 * ```
 */
export function getNotificationDotColors(): Record<ActivityType | "default", string> {
  return Object.fromEntries(
    Object.entries(notificationTypeStyles).map(([type, style]) => [
      type,
      style.dotColor,
    ])
  ) as Record<ActivityType | "default", string>;
}

/**
 * Get only the title prefixes for use in text generation
 *
 * @returns Record mapping activity types to their title prefixes
 *
 * @example
 * ```typescript
 * const prefixes = getNotificationTitlePrefixes();
 * // Returns: { task: "Task", payroll: "Payroll", ... }
 * ```
 */
export function getNotificationTitlePrefixes(): Record<ActivityType | "default", string> {
  return Object.fromEntries(
    Object.entries(notificationTypeStyles).map(([type, style]) => [
      type,
      style.titlePrefix || "Notification",
    ])
  ) as Record<ActivityType | "default", string>;
}
