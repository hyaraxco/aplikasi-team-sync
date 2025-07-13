import FilterBar, { FilterOption, SortOption } from '@/components/molecules/data-display/FilterBar'

interface NotifFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filters: Record<string, string[]>
  onFilterChange: (type: string, value: string) => void
  sortField: string
  sortDirection: 'asc' | 'desc'
  onSortFieldChange: (field: string) => void
  onSortDirectionChange: (direction: 'asc' | 'desc') => void
  onClearFilters: () => void
}

const CATEGORY_FILTER_OPTIONS: FilterOption[] = [
  { id: 'project', label: 'Project' },
  { id: 'task', label: 'Task' },
  { id: 'team', label: 'Team' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'user', label: 'User' },
]

const SORT_OPTIONS: SortOption[] = [
  { id: 'timestamp', label: 'Date' },
  { id: 'type', label: 'Category' },
]

export default function NotifFilterBar({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  onClearFilters,
}: NotifFilterBarProps) {
  const filterOptions = {
    category: CATEGORY_FILTER_OPTIONS,
    // Bisa tambahkan filter tanggal jika ingin, misal fromDate/toDate (tapi perlu komponen date picker terpisah)
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
