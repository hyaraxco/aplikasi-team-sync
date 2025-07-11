'use client'

import FilterBar, { FilterOption, SortOption } from '@/components/common/data-display/FilterBar'

export type ProjectFilters = Record<string, string[]>

interface ProjectFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filters: ProjectFilters
  onFilterChange: (type: string, value: string) => void
  sortField: string
  sortDirection: 'asc' | 'desc'
  onSortFieldChange: (field: string) => void
  onSortDirectionChange: (direction: 'asc' | 'desc') => void
  onClearFilters: () => void
}

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { id: 'planning', label: 'Planning' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'on-hold', label: 'On Hold' },
  { id: 'completed', label: 'Completed' },
]

const SORT_OPTIONS: SortOption[] = [
  { id: 'name', label: 'Project Name' },
  { id: 'deadline', label: 'Deadline' },
  { id: 'status', label: 'Status' },
]

const ProjectFilterBar = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  onClearFilters,
}: ProjectFilterBarProps) => {
  const filterOptions = {
    status: STATUS_FILTER_OPTIONS,
    // Tambahkan filter lain jika ada
  }

  return (
    <FilterBar
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      filters={filters}
      filterOptions={filterOptions}
      onFilterChange={onFilterChange}
      sortField={sortField}
      sortOptions={SORT_OPTIONS}
      sortDirection={sortDirection}
      onSortFieldChange={onSortFieldChange}
      onSortDirectionChange={onSortDirectionChange}
      onClearFilters={onClearFilters}
    />
  )
}

export default ProjectFilterBar
