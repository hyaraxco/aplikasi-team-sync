'use client'

import { DashboardLayout } from '../dashboard/section/dashboard-layout'
import { TasksContent } from './section/TaskContent.section'

export default function TasksPage() {
  return (
    <DashboardLayout>
      <TasksContent />
    </DashboardLayout>
  )
}
