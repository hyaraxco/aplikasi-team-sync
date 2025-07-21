import { DashboardLayout } from '@/components/templates'
import { ProjectDetailContent } from './section/ProjectDetailContent.section'

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params

  return (
    <DashboardLayout>
      <ProjectDetailContent projectId={id} />
    </DashboardLayout>
  )
}
