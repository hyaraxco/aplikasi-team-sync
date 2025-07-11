'use client'

import { Button } from '@/components/atomics/button'
import { useAuth } from '@/components/auth-provider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEarnings } from '@/hooks/use-earnings'
import { formatRupiah } from '@/lib/utils'
import { format } from 'date-fns'

export function EarningsContent() {
  const earnings = useEarnings()
  const { userRole } = useAuth()

  const taskEarnings = earnings.filter(e => e.type === 'task')
  const attendanceEarnings = earnings.filter(e => e.type === 'attendance')
  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className='space-y-6 p-4 md:p-6'>
      <h1 className='text-3xl font-bold tracking-tight'>My Balance</h1>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='space-y-2'>
          <p className='text-sm text-muted-foreground'>Task Earnings</p>
          <p className='text-2xl font-bold'>
            {formatRupiah(taskEarnings.reduce((sum, e) => sum + e.amount, 0))}
          </p>
        </div>
        <div className='space-y-2'>
          <p className='text-sm text-muted-foreground'>Attendance Earnings</p>
          <p className='text-2xl font-bold'>
            {formatRupiah(attendanceEarnings.reduce((sum, e) => sum + e.amount, 0))}
          </p>
        </div>
        <div className='space-y-2'>
          <p className='text-sm text-muted-foreground'>Total Earnings</p>
          <p className='text-2xl font-bold'>{formatRupiah(totalEarnings)}</p>
        </div>
      </div>

      <Tabs defaultValue='tasks'>
        <TabsList>
          <TabsTrigger value='tasks'>Task Earnings</TabsTrigger>
          <TabsTrigger value='attendance'>Attendance Earnings</TabsTrigger>
        </TabsList>
        <TabsContent value='tasks'>
          {taskEarnings.length === 0 ? (
            <div className='py-6 text-center text-muted-foreground'>No task earnings yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskEarnings.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{format(e.createdAt.toDate(), 'PP')}</TableCell>
                    <TableCell>{formatRupiah(e.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        <TabsContent value='attendance'>
          {attendanceEarnings.length === 0 ? (
            <div className='py-6 text-center text-muted-foreground'>
              No attendance earnings yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceEarnings.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{format(e.createdAt.toDate(), 'PP')}</TableCell>
                    <TableCell>{formatRupiah(e.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      <Button disabled>Withdraw (Coming Soon)</Button>
    </div>
  )
}
