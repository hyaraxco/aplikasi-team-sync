import { Button } from '@/components/atomics/button'
import React from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export const PageHeader = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: PageHeaderProps) => {
  return (
    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
      <div>
        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>{title}</h1>
        {description && <p className='text-muted-foreground'>{description}</p>}
      </div>

      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {icon}
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
