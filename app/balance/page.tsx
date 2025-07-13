'use client'

import { DashboardLayout } from '@/components/templates/dashboard-layout'
import { EarningsContent } from '@/components/templates/earnings-content'

export default function BalancePage() {
  return (
    <DashboardLayout>
      <EarningsContent />
    </DashboardLayout>
  )
}
