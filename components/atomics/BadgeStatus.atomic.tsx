import { ProjectStatus } from '@/lib/firestore'
import { cn, getStatusBadge } from '@/lib/utils'

interface BadgeStatusProps {
  status: ProjectStatus
  className?: string
}

export const BadgeStatus = ({ status, className = '' }: BadgeStatusProps) => {
  const statusBadge = getStatusBadge(status)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white capitalize',
        statusBadge.color,
        className
      )}
      style={{ backgroundColor: statusBadge.hexColor }}
    >
      {statusBadge.Icon && <statusBadge.Icon className='h-3 w-3' />}
      {status.replace('-', ' ')}
    </span>
  )
}

export default BadgeStatus
