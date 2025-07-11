'use client'

import FilterBar, { FilterOption, SortOption } from '@/components/common/data-display/FilterBar'

interface TaskFilterBarSectionProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filters: {
    priority: string[]
    status: string[]
  }
  onFilterChange: (type: 'priority' | 'status', value: string) => void
  sortField: string
  sortDirection: 'asc' | 'desc'
  onSortFieldChange: (field: string) => void
  onSortDirectionChange: (direction: 'asc' | 'desc') => void
  onClearFilters: () => void
}

const PRIORITY_FILTER_OPTIONS: FilterOption[] = [
  { id: 'High', label: 'High' },
  { id: 'Medium', label: 'Medium' },
  { id: 'Low', label: 'Low' },
]

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'done', label: 'Done' },
  { id: 'rejected', label: 'Rejected' },
]

const SORT_OPTIONS: SortOption<string>[] = [
  { id: 'dueDate', label: 'Due Date' },
  { id: 'priority', label: 'Priority' },
  { id: 'name', label: 'Task Name' },
]

const TaskFilterBarSection = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  onClearFilters,
}: TaskFilterBarSectionProps) => {
  const filterOptions: Record<string, FilterOption[]> = {
    priority: PRIORITY_FILTER_OPTIONS,
    status: STATUS_FILTER_OPTIONS,
  }

  return (
    <FilterBar
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      filters={filters}
      filterOptions={filterOptions}
      onFilterChange={(type: string, value: string) =>
        onFilterChange(type as 'priority' | 'status', value)
      }
      sortField={sortField}
      sortDirection={sortDirection}
      sortOptions={SORT_OPTIONS}
      onSortFieldChange={onSortFieldChange}
      onSortDirectionChange={onSortDirectionChange}
      onClearFilters={onClearFilters}
    />
  )
}

export default TaskFilterBarSection
