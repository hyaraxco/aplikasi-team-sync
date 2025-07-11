'use client'

import { Button } from '@/components/atomics/button'
import { useAuth } from '@/components/auth-provider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Briefcase,
  Calendar,
  ChartNoAxesCombined,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
  UserCog2,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
// import { SidebarToggle } from "@/components/sidebar-toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSidebar } from '@/hooks/use-sidebar'
import { Logo } from './common/logo'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export function Sidebar({ className, isCollapsed, setIsCollapsed }: SidebarProps) {
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const { userRole } = useAuth()

  // Animasi smooth
  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64'

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false)
    }
  }, [pathname, setIsOpen])

  const sections = [
    {
      title: 'Dashboard',
      routes: [
        {
          label: 'Dashboard',
          icon: Home,
          href: '/dashboard',
          active: pathname === '/dashboard',
        },
      ],
    },
    {
      title: 'Projects & Tasks',
      routes: [
        {
          label: 'Projects',
          icon: Briefcase,
          href: '/projects',
          active: pathname === '/projects',
        },
        {
          label: 'Tasks',
          icon: CheckSquare,
          href: '/tasks',
          active: pathname === '/tasks',
        },
      ],
    },
    {
      title: 'Team Management',
      routes: [
        {
          label: 'Employees',
          icon: UserCog2,
          href: '/users',
          active: pathname === '/users',
          adminOnly: true,
        },
        {
          label: 'Teams',
          icon: UsersRound,
          href: '/teams',
          active: pathname === '/teams',
        },
        {
          label: 'Attendance',
          icon: Calendar,
          href: '/attendance',
          active: pathname === '/attendance',
        },
        {
          label: userRole === 'admin' ? 'Payroll' : 'Balance',
          icon: Wallet,
          href: userRole === 'admin' ? '/payroll' : '/balance',
          active: userRole === 'admin' ? pathname === '/payroll' : pathname === '/balance',
        },
      ],
    },
    {
      title: 'System',
      routes: [
        {
          label: 'Reports',
          icon: ChartNoAxesCombined,
          href: '/reports',
          active: pathname === '/reports',
          adminOnly: true,
        },
        {
          label: 'Settings',
          icon: Settings,
          href: '/settings',
          active: pathname === '/settings',
        },
      ],
    },
  ]

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    router.push(href)
    if (window.innerWidth < 1024) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Overlay untuk mobile */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden',
          isOpen ? 'block' : 'hidden'
        )}
        onClick={() => setIsOpen(false)}
      />
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 border-r bg-background transition-all duration-300 lg:flex flex-col',
          sidebarWidth,
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className,
          'hidden lg:flex'
        )}
      >
        <div className='flex h-16 items-center border-b px-4 justify-between relative'>
          <Link
            href='/dashboard'
            className='flex items-center gap-2 font-semibold'
            onClick={e => handleNavigation('/dashboard', e)}
          >
            <Logo isCollapsed={isCollapsed} />
            {!isCollapsed && <span className='text-xl'>Team Sync</span>}
          </Link>

          <Button
            variant='ghost'
            size='icon'
            className='absolute -right-3 top-15 hidden h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm md:flex'
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className='h-3 w-3' />
            ) : (
              <ChevronLeft className='h-3 w-3' />
            )}
          </Button>
        </div>
        <ScrollArea className='flex-1 overflow-y-auto'>
          <div className='px-1 py-2'>
            <nav className={cn('flex flex-col', isCollapsed ? 'gap-1' : 'gap-4')}>
              {sections.map(section => (
                <div key={section.title}>
                  {!isCollapsed && (
                    <div className='px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      {section.title}
                    </div>
                  )}
                  <div className='flex flex-col gap-1 mt-1'>
                    <TooltipProvider>
                      {section.routes.map(route => {
                        if (route.adminOnly && userRole !== 'admin') {
                          return null
                        }
                        return (
                          <Tooltip key={route.href} delayDuration={200}>
                            <TooltipTrigger asChild>
                              <Link
                                href={route.href}
                                onClick={e => handleNavigation(route.href, e)}
                                aria-current={route.active ? 'page' : undefined}
                              >
                                <Button
                                  variant={route.active ? 'secondary' : 'ghost'}
                                  className={cn(
                                    'w-full justify-start transition-all duration-300',
                                    route.active ? 'bg-secondary' : '',
                                    isCollapsed ? 'px-0 flex items-center justify-center' : ''
                                  )}
                                >
                                  <route.icon className='h-5 w-5' />
                                  {!isCollapsed && <span className='ml-3'>{route.label}</span>}
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            {isCollapsed && (
                              <TooltipContent side='right' className='text-xs'>
                                {route.label}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        )
                      })}
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </ScrollArea>
      </aside>
      {/* Sidebar Mobile tetap seperti sekarang */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transition-transform duration-300 lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex h-14 items-center border-b px-4'>
          <Link
            href='/dashboard'
            className='flex items-center gap-2 font-semibold'
            onClick={e => handleNavigation('/dashboard', e)}
          >
            <Logo isCollapsed={isCollapsed} />
            {!isCollapsed && <span className='text-xl'>Team Sync</span>}
          </Link>
          <Button
            variant='ghost'
            size='icon'
            className='ml-auto lg:hidden'
            onClick={() => setIsOpen(false)}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
        <ScrollArea className='h-[calc(100vh-3.5rem)]'>
          <div className='px-3 py-2'>
            <nav className='flex flex-col gap-4'>
              {sections.map(section => (
                <div key={section.title}>
                  <div className='px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    {section.title}
                  </div>
                  <div className='flex flex-col gap-1 mt-1'>
                    {section.routes.map(route => {
                      if (route.adminOnly && userRole !== 'admin') {
                        return null
                      }
                      return (
                        <Link
                          key={route.href}
                          href={route.href}
                          onClick={e => handleNavigation(route.href, e)}
                          aria-current={route.active ? 'page' : undefined}
                        >
                          <Button
                            variant={route.active ? 'secondary' : 'ghost'}
                            className={cn(
                              'w-full justify-start',
                              route.active ? 'bg-secondary' : ''
                            )}
                          >
                            <route.icon className='mr-2 h-4 w-4' />
                            {route.label}
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </ScrollArea>
      </aside>
    </>
  )
}
