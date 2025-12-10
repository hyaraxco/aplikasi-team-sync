import { Badge } from '@/components/atomics/badge'
import { getUserStatusBadge } from '@/lib/ui'

interface UserStatusBadgeProps {
  status: string | undefined | null
  className?: string
}

/**
 * Reusable User Status Badge component with dark mode support
 * 
 * Provides consistent status badge styling across all components
 * with proper accessibility and dark mode contrast.
 * 
 * @param status - User status value
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <UserStatusBadge status="pending" />
 * <UserStatusBadge status="active" className="ml-2" />
 * ```
 */
export const UserStatusBadge = ({ status, className = '' }: UserStatusBadgeProps) => {
  const statusConfig = getUserStatusBadge(status)

  return (
    <Badge 
      variant="outline" 
      className={`${statusConfig.className} ${className}`}
    >
      {statusConfig.text}
    </Badge>
  )
}

export default UserStatusBadge
