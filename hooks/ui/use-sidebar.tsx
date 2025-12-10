/**
 * @fileoverview Sidebar state management hook for Team Sync application
 *
 * This hook provides global sidebar state management for the application,
 * handling both mobile and desktop sidebar behavior with automatic
 * route-based closing on mobile devices.
 *
 * @author Team Sync Development Team
 * @since 1.0.0
 */

'use client'

import type React from 'react'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sidebar context type definition
 */
interface SidebarContextType {
  /** Whether the sidebar is open (mobile) */
  isOpen: boolean
  /** Set sidebar open state */
  setIsOpen: (isOpen: boolean) => void
  /** Toggle sidebar open/close */
  toggleSidebar: () => void
}

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * Sidebar context for state management
 */
const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  setIsOpen: () => {},
  toggleSidebar: () => {},
})

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Sidebar provider component
 *
 * Provides sidebar state management to the entire application.
 * Automatically closes sidebar on route changes for mobile devices.
 *
 * @param children - React children components
 */
export function SidebarProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for accessing sidebar state and controls
 *
 * @returns Sidebar state and control functions
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { isOpen, setIsOpen, toggleSidebar } = useSidebar()
 *
 *   return (
 *     <button onClick={toggleSidebar}>
 *       {isOpen ? 'Close' : 'Open'} Sidebar
 *     </button>
 *   )
 * }
 * ```
 */
export function useSidebar() {
  const context = useContext(SidebarContext)

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }

  return context
}
