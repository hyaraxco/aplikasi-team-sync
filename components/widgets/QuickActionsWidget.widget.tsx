'use client'

import { Button } from '@/components/atomics/button'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/card'
import { BarChart3, CheckSquare, Clock, DollarSign, Plus, Settings, Users, Zap } from 'lucide-react'
import Link from 'next/link'

interface QuickActionsWidgetProps {
  className?: string
}

export function QuickActionsWidget({ className = '' }: QuickActionsWidgetProps) {
  const { userRole } = useAuth()

  const employeeActions = [
    {
      label: 'View My Tasks',
      icon: <CheckSquare className='h-4 w-4' />,
      href: '/tasks',
      className:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-900/60',
    },
    {
      label: 'Check Attendance',
      icon: <Clock className='h-4 w-4' />,
      href: '/attendance',
      className:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50 hover:bg-green-200 dark:hover:bg-green-900/60',
    },
    {
      label: 'View Earnings',
      icon: <DollarSign className='h-4 w-4' />,
      href: '/balance',
      className:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50 hover:bg-purple-200 dark:hover:bg-purple-900/60',
    },
  ]

  const adminActions = [
    {
      label: 'Create Project',
      icon: <Plus className='h-4 w-4' />,
      href: '/projects',
      className:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-900/60',
    },
    {
      label: 'Manage Team',
      icon: <Users className='h-4 w-4' />,
      href: '/users',
      className:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50 hover:bg-green-200 dark:hover:bg-green-900/60',
    },
    {
      label: 'View Reports',
      icon: <BarChart3 className='h-4 w-4' />,
      href: '/reports',
      className:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50 hover:bg-purple-200 dark:hover:bg-purple-900/60',
    },
    {
      label: 'System Settings',
      icon: <Settings className='h-4 w-4' />,
      href: '/settings',
      className:
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50 hover:bg-orange-200 dark:hover:bg-orange-900/60',
    },
  ]

  const actions = userRole === 'admin' ? adminActions : employeeActions

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Zap className='h-5 w-5' />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid gap-3'>
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant='outline'
                className={`w-full justify-start gap-2 h-auto p-3 ${action.className}`}
              >
                {action.icon}
                <span className='font-medium'>{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
