/**
 * @fileoverview Type definitions for filtering and sorting functionality
 * 
 * This module contains type definitions for filter states, actions, and
 * related functionality used throughout the application for data filtering
 * and sorting operations.
 * 
 * @author Team Sync Development Team
 * @since 1.0.0
 */

/**
 * Generic filter state interface
 * 
 * @template T - The type of items being filtered
 */
export interface FilterState<T = any> {
  /** Current search term */
  searchTerm: string;
  /** Active filters grouped by type */
  filters: Record<string, string[]>;
  /** Field to sort by */
  sortField: keyof T;
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
}

/**
 * Filter actions interface for managing filter state
 * 
 * @template T - The type of items being filtered
 */
export interface FilterActions<T = any> {
  /** Set the search term */
  setSearchTerm: (term: string) => void;
  /** Toggle a filter value */
  toggleFilter: (type: string, value: string) => void;
  /** Clear all filters and search */
  clearFilters: () => void;
  /** Handle sorting by field */
  handleSort: (field: keyof T) => void;
  /** Set sort direction */
  setSortDirection: (direction: 'asc' | 'desc') => void;
}

/**
 * Filter option for dropdown/checkbox filters
 */
export interface FilterOption {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Whether option is disabled */
  disabled?: boolean;
}

/**
 * Sort option for sort dropdowns
 * 
 * @template T - The field type (usually string)
 */
export interface SortOption<T = string> {
  /** Field identifier */
  id: T;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
}

/**
 * Filter configuration for a specific filter type
 */
export interface FilterConfig {
  /** Filter type identifier */
  type: string;
  /** Display label */
  label: string;
  /** Available options */
  options: FilterOption[];
  /** Whether multiple selection is allowed */
  multiple?: boolean;
  /** Default selected values */
  defaultValues?: string[];
}

/**
 * Complete filter bar configuration
 * 
 * @template T - The type of items being filtered
 */
export interface FilterBarConfig<T = any> {
  /** Search configuration */
  search?: {
    placeholder?: string;
    enabled?: boolean;
  };
  /** Available filters */
  filters?: FilterConfig[];
  /** Available sort options */
  sortOptions?: SortOption<keyof T>[];
  /** Default sort field */
  defaultSortField?: keyof T;
  /** Default sort direction */
  defaultSortDirection?: 'asc' | 'desc';
}

/**
 * Filter result with metadata
 * 
 * @template T - The type of filtered items
 */
export interface FilterResult<T = any> {
  /** Filtered items */
  items: T[];
  /** Total count before filtering */
  totalCount: number;
  /** Count after filtering */
  filteredCount: number;
  /** Applied filters summary */
  appliedFilters: {
    searchTerm?: string;
    filters: Record<string, string[]>;
    sortField: keyof T;
    sortDirection: 'asc' | 'desc';
  };
}

/**
 * Hook return type for filter functionality
 * 
 * @template T - The type of items being filtered
 */
export type UseFilterReturn<T = any> = [
  /** Filtered and sorted items */
  T[],
  /** Current filter state */
  FilterState<T>,
  /** Filter actions */
  FilterActions<T>
];

/**
 * Predefined filter types for common use cases
 */
export type CommonFilterTypes = 
  | 'status'
  | 'priority'
  | 'role'
  | 'department'
  | 'team'
  | 'project'
  | 'assignee'
  | 'dateRange'
  | 'category';

/**
 * Filter value types
 */
export type FilterValue = string | number | boolean | Date | null;

/**
 * Advanced filter operator types
 */
export type FilterOperator = 
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in'
  | 'notIn';

/**
 * Advanced filter condition
 */
export interface FilterCondition {
  /** Field to filter on */
  field: string;
  /** Filter operator */
  operator: FilterOperator;
  /** Filter value(s) */
  value: FilterValue | FilterValue[];
}

/**
 * Advanced filter state with conditions
 */
export interface AdvancedFilterState {
  /** Search term */
  searchTerm: string;
  /** Filter conditions */
  conditions: FilterCondition[];
  /** Sort configuration */
  sort: {
    field: string;
    direction: 'asc' | 'desc';
  };
}
