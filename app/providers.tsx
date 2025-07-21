'use client'

import { AuthProvider } from '@/components/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider } from '@/hooks'
import type React from 'react'

interface ProvidersProps {
  children: React.ReactNode
}

/**
 * Client-side providers wrapper
 * 
 * This component wraps all client-side providers (Theme, Auth, Sidebar)
 * and is used by the server-side layout component.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
