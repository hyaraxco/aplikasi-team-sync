'use client'

import { AttendanceContent } from '@/components/templates/attendance-content'
import { DashboardLayout } from '@/components/templates/dashboard-layout'

export default function AttendancePage() {
  return (
    <DashboardLayout>
      <AttendanceContent />
    </DashboardLayout>
  )
}
