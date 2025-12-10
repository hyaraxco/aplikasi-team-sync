import { Button } from '@/components/atomics/button'
import React from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
  inline?: boolean // New prop for inline layout
}

export const PageHeader = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  inline = false,
}: PageHeaderProps) => {
  // Inline layout for use with back buttons or other inline elements
  if (inline) {
    return (
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>{title}</h1>
          {description && <p className='text-muted-foreground text-sm'>{description}</p>}
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

  // Default layout
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
