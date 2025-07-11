'use client'

import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/molecules/dropdown-menu'
import { Filter, Plus, Search, SortAsc, X } from 'lucide-react'

interface ProjectFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: string[]
  onStatusChange: (status: string) => void
  sort: string
  sortDir: 'asc' | 'desc'
  onSortChange: (field: string) => void
  onAddProject?: () => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export default function ProjectFilterBar({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  sort,
  sortDir,
  onSortChange,
  onAddProject,
  onClearFilters,
  hasActiveFilters,
}: ProjectFilterBarProps) {
  return (
    <div className='flex flex-col sm:flex-row gap-4 mb-4'>
      <div className='flex-1 flex gap-4'>
        {/* Search */}
        <div className='flex-1 relative'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search projects...'
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className='pl-8 pr-8'
          />
          {searchTerm && (
            <button
              type='button'
              aria-label='Clear search'
              className='absolute right-2 top-2.5 text-muted-foreground hover:text-primary'
              onClick={() => onSearchChange('')}
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='gap-2'>
              <Filter className='h-4 w-4' />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={filterStatus.includes('planning')}
                  onChange={() => onStatusChange('planning')}
                />
                Planning
              </label>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={filterStatus.includes('in-progress')}
                  onChange={() => onStatusChange('in-progress')}
                />
                In Progress
              </label>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={filterStatus.includes('on-hold')}
                  onChange={() => onStatusChange('on-hold')}
                />
                On Hold
              </label>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={filterStatus.includes('completed')}
                  onChange={() => onStatusChange('completed')}
                />
                Completed
              </label>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {hasActiveFilters && (
              <DropdownMenuItem onClick={onClearFilters} className='text-red-500'>
                Clear all filters
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='gap-2'>
              <SortAsc className='h-4 w-4' />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onSortChange('name')}
              className={sort === 'name' ? 'font-semibold' : ''}
            >
              {sort === 'name' && <span className='mr-2 text-primary'>✔</span>}
              Name
              {sort === 'name' && <span className='ml-2'>{sortDir === 'asc' ? '↑' : '↓'}</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortChange('status')}
              className={sort === 'status' ? 'font-semibold' : ''}
            >
              {sort === 'status' && <span className='mr-2 text-primary'>✔</span>}
              Status
              {sort === 'status' && <span className='ml-2'>{sortDir === 'asc' ? '↑' : '↓'}</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortChange('progress')}
              className={sort === 'progress' ? 'font-semibold' : ''}
            >
              {sort === 'progress' && <span className='mr-2 text-primary'>✔</span>}
              Progress
              {sort === 'progress' && <span className='ml-2'>{sortDir === 'asc' ? '↑' : '↓'}</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortChange('deadline')}
              className={sort === 'deadline' ? 'font-semibold' : ''}
            >
              {sort === 'deadline' && <span className='mr-2 text-primary'>✔</span>}
              Deadline
              {sort === 'deadline' && <span className='ml-2'>{sortDir === 'asc' ? '↑' : '↓'}</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Add Project Button */}
      {onAddProject && (
        <Button onClick={onAddProject} className='gap-2'>
          <Plus className='h-4 w-4' />
          Add Project
        </Button>
      )}
    </div>
  )
}
