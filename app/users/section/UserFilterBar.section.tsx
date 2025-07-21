'use client'

import { Input } from '@/components/atomics/input'
import { Card, CardContent } from '@/components/molecules/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/molecules/select'
import { Search } from 'lucide-react'
import { ChangeEvent } from 'react'

interface UserFilterBarProps {
  searchQuery: string
  setSearchQuery: (value: string) => void
  roleFilter: string
  setRoleFilter: (value: string) => void
  departmentFilter: string
  setDepartmentFilter: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
}

export default function UserFilterBar({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  departmentFilter,
  setDepartmentFilter,
  statusFilter,
  setStatusFilter,
}: UserFilterBarProps) {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='grid gap-4 md:grid-cols-4'>
          <div className='space-y-2'>
            <div className='font-medium'>Search</div>
            <div className='relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Search by name or email...'
                className='pl-8'
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className='space-y-2'>
            <div className='font-medium'>Role</div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder='All Roles' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Roles</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
                <SelectItem value='manager'>Manager</SelectItem>
                <SelectItem value='team lead'>Team Lead</SelectItem>
                <SelectItem value='employee'>Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <div className='font-medium'>Department</div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder='All Departments' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Departments</SelectItem>
                <SelectItem value='engineering'>Engineering</SelectItem>
                <SelectItem value='design'>Design</SelectItem>
                <SelectItem value='marketing'>Marketing</SelectItem>
                <SelectItem value='product'>Product</SelectItem>
                <SelectItem value='finance'>Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <div className='font-medium'>Status</div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder='All Statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Statuses</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
