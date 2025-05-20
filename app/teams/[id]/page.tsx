import { DashboardLayout } from "@/components/dashboard-layout"
import { TeamDetailContent } from "@/components/team-detail-content"

interface TeamDetailPageProps {
  params: {
    id: string
  }
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  return (
    <DashboardLayout>
      <TeamDetailContent teamId={params.id} />
    </DashboardLayout>
  )
}
