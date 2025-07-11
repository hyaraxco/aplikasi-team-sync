import { Label } from '@/components/atomics/label'
import {
  CombinedDatePicker,
  DatePicker,
  DatePickerMode,
  MonthPicker,
  RangePicker,
  WeekPicker,
  YearPicker,
} from '@/components/molecules/AntDatePicker'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/molecules/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'

export function DatePickerDemo() {
  const [date, setDate] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null] | null>(null)
  const [pickerMode, setPickerMode] = useState<DatePickerMode>('date')

  const handleModeChange = (value: string) => {
    setPickerMode(value as DatePickerMode)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date Picker Components</CardTitle>
        <CardDescription>
          Ant Design date picker components for different selection modes
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-6'>
        <div className='grid gap-2'>
          <Label>Date Picker</Label>
          <DatePicker value={date} onChange={setDate} placeholder='Select date' />
        </div>

        <div className='grid gap-2'>
          <Label>Week Picker</Label>
          <WeekPicker value={date} onChange={setDate} placeholder='Select week' />
        </div>

        <div className='grid gap-2'>
          <Label>Month Picker</Label>
          <MonthPicker value={date} onChange={setDate} placeholder='Select month' />
        </div>

        <div className='grid gap-2'>
          <Label>Year Picker</Label>
          <YearPicker value={date} onChange={setDate} placeholder='Select year' />
        </div>

        <div className='grid gap-2'>
          <Label>Date Range Picker</Label>
          <RangePicker value={dateRange} onChange={setDateRange} />
        </div>

        <div className='grid gap-4'>
          <Label>Combined Date Picker with Mode Selector</Label>
          <div className='flex gap-2'>
            <Select value={pickerMode} onValueChange={handleModeChange}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Select picker mode' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='date'>Date</SelectItem>
                <SelectItem value='week'>Week</SelectItem>
                <SelectItem value='month'>Month</SelectItem>
                <SelectItem value='year'>Year</SelectItem>
                <SelectItem value='range'>Range</SelectItem>
              </SelectContent>
            </Select>
            <div className='flex-1'>
              <CombinedDatePicker
                mode={pickerMode}
                value={date}
                onChange={setDate}
                rangeValue={dateRange}
                onRangeChange={setDateRange}
                placeholder={pickerMode === 'range' ? ['Start date', 'End date'] : 'Select date'}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
