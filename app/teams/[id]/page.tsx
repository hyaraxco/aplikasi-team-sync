import { DashboardLayout } from '@/components/templates'
import { TeamDetailContent } from './section/TeamDetailContent.section'

interface TeamDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = await params

  return (
    <DashboardLayout>
      <TeamDetailContent teamId={id} />
    </DashboardLayout>
  )
}
