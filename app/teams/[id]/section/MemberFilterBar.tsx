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
import { MEMBER_STATUS } from '@/lib/constants'
import { Filter, Plus, Search, SortAsc, X } from 'lucide-react'

interface MemberFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterRoles: string[]
  filterStatus: string[]
  onRoleChange: (role: string) => void
  onStatusChange: (status: string) => void
  sort: string
  sortDir: 'asc' | 'desc'
  onSortChange: (field: string) => void
  onAddMember?: () => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  availableRoles: string[]
}

export default function MemberFilterBar({
  searchTerm,
  onSearchChange,
  filterRoles,
  filterStatus,
  onRoleChange,
  onStatusChange,
  sort,
  sortDir,
  onSortChange,
  onAddMember,
  onClearFilters,
  hasActiveFilters,
  availableRoles,
}: MemberFilterBarProps) {
  return (
    <div className='flex flex-col sm:flex-row gap-4 mb-4'>
      <div className='flex-1 flex gap-4'>
        {/* Search */}
        <div className='flex-1 relative'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search members...'
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
            <DropdownMenuLabel>Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableRoles.map((role: string) => (
              <DropdownMenuItem asChild key={role}>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={filterRoles.includes(role)}
                    onChange={() => onRoleChange(role)}
                  />
                  {role}
                </label>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {Object.values(MEMBER_STATUS).map(status => (
              <DropdownMenuItem asChild key={status}>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={filterStatus.includes(status.toLowerCase())}
                    onChange={() => onStatusChange(status.toLowerCase())}
                  />
                  {status}
                </label>
              </DropdownMenuItem>
            ))}
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
              onClick={() => onSortChange('joinedAt')}
              className={sort === 'joinedAt' ? 'font-semibold' : ''}
            >
              {sort === 'joinedAt' && <span className='mr-2 text-primary'>✔</span>}
              Join Date
              {sort === 'joinedAt' && <span className='ml-2'>{sortDir === 'asc' ? '↑' : '↓'}</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Add Member Button */}
      {onAddMember && (
        <Button onClick={onAddMember} className='gap-2'>
          <Plus className='h-4 w-4' />
          Add Member
        </Button>
      )}
    </div>
  )
}
