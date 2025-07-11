import { Button } from '@/components/atomics/button'
import React from 'react'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) => {
  return (
    <div className='flex flex-col items-center justify-center py-12 text-center'>
      <div className='rounded-full bg-muted p-6 mb-4'>{icon}</div>
      <h2 className='text-lg font-medium mb-1'>{title}</h2>
      <p className='text-muted-foreground mb-6 max-w-sm'>{description}</p>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  )
}
