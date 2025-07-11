'use client'

import { Button } from '@/components/atomics/button'
import { ReactNode } from 'react'
import { FilterDropdown, FilterOption } from './FilterDropdown'
import { SearchInput } from './SearchInput'
import { SortDropdown, SortOption } from './SortDropdown'

interface FilterConfig<T extends string = string> {
  type: string
  label: string
  options: FilterOption<T>[]
  values: T[]
  onChange: (value: T) => void
}

interface DataFilterBarProps<SortField extends string> {
  searchTerm: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterConfig[]
  sortField: SortField
  sortOptions: SortOption<SortField>[]
  sortDirection: 'asc' | 'desc'
  onSortFieldChange: (field: SortField) => void
  onSortDirectionChange: (direction: 'asc' | 'desc') => void

  onClearFilters?: () => void
  hasFilters?: boolean

  children?: ReactNode
}

/**
 * Reusable filter bar component that combines search, filters, and sorting
 */
export function DataFilterBar<SortField extends string>({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  sortField,
  sortOptions,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  onClearFilters,
  hasFilters,
  children,
}: DataFilterBarProps<SortField>) {
  const showClearButton =
    hasFilters ?? (searchTerm.length > 0 || filters.some(f => f.values.length > 0))

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className='max-w-sm'
      />

      <div className='flex flex-wrap gap-2'>
        {filters.map((filter, index) => (
          <FilterDropdown
            key={`${filter.type}-${index}`}
            filterType={filter.type}
            filterLabel={filter.label}
            options={filter.options}
            selectedValues={filter.values}
            onChange={filter.onChange}
          />
        ))}

        <SortDropdown
          sortField={sortField}
          sortOptions={sortOptions}
          sortDirection={sortDirection}
          onSortFieldChange={onSortFieldChange}
          onSortDirectionChange={onSortDirectionChange}
        />

        {children}

        {showClearButton && onClearFilters && (
          <Button variant='ghost' size='sm' onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}
