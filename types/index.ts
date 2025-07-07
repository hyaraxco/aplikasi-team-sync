/**
 * @fileoverview Shared type definitions for the Team Sync application
 * 
 * This module contains common type definitions, utility types, and type guards
 * that are used across multiple modules in the application.
 * 
 * @author Team Sync Development Team
 * @since 1.0.0
 */

import { Timestamp } from 'firebase/firestore';
import { LucideIcon } from 'lucide-react';

/**
 * Utility type for making specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for making specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Type for date-like values that can be converted to Date
 */
export type DateLike = Date | Timestamp | string | number;

/**
 * Type guard to check if a value is a Firestore Timestamp
 */
export function isFirestoreTimestamp(value: any): value is Timestamp {
  return value && 
         typeof value === 'object' && 
         typeof value.toDate === 'function' &&
         typeof value.seconds === 'number' &&
         typeof value.nanoseconds === 'number';
}

/**
 * Type guard to check if a value is a valid Date
 */
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type for currency formatting options
 */
export interface CurrencyFormatOptions {
  /** Whether to include currency symbol */
  withSymbol?: boolean;
  /** Currency code (USD, IDR, etc.) */
  currency?: 'USD' | 'IDR' | string;
  /** Locale for formatting */
  locale?: string;
}

/**
 * Type for badge configuration
 */
export interface BadgeConfig {
  /** CSS color class */
  color: string;
  /** Optional icon component */
  Icon?: LucideIcon;
}

/**
 * Type for API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Type for pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Type for filter state
 */
export interface FilterState<T = any> {
  searchTerm: string;
  filters: Record<string, string[]>;
  sortField: keyof T;
  sortDirection: 'asc' | 'desc';
}

/**
 * Type for filter actions
 */
export interface FilterActions<T = any> {
  setSearchTerm: (term: string) => void;
  toggleFilter: (type: string, value: string) => void;
  clearFilters: () => void;
  handleSort: (field: keyof T) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
}

/**
 * Type for form validation errors
 */
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Type for async operation states
 */
export type AsyncState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Type for theme preferences
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Type for notification types
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Generic type for database entities with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Type for user preferences
 */
export interface UserPreferences {
  theme: Theme;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    itemsPerPage: number;
  };
}

/**
 * Type for error with additional context
 */
export interface AppError extends Error {
  code?: string;
  context?: Record<string, any>;
  timestamp?: Date;
}
