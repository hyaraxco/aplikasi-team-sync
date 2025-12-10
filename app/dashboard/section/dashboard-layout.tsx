'use client'

import { Spinner } from '@/components/atomics/spinner'
import { useAuth } from '@/components/auth-provider'
import { Navbar } from '@/components/organisms/navbar'
import { Sidebar } from '@/components/organisms/sidebar'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useState } from 'react'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
    const savedSidebarState = localStorage.getItem('sidebarCollapsed')
    if (savedSidebarState) {
      setIsSidebarCollapsed(savedSidebarState === 'true')
    }
  }, [])

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString())
    }
  }, [isSidebarCollapsed, isMounted])

  useEffect(() => {
    // Redirect if not authenticated and not loading
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // Handle loading state
  if (!isMounted || loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  // Don't render the layout if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      {/* Main content area with fixed left margin on desktop */}
      <div
        className={`flex flex-1 flex-col w-full transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
      >
        <Navbar />
        <main className='flex-1 overflow-y-auto p-4 md:p-6'>{children}</main>
      </div>
    </div>
  )
}
