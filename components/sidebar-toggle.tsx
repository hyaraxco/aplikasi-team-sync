"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface SidebarToggleProps {
  onClick: () => void
}

export function SidebarToggle({ onClick }: SidebarToggleProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed left-4 top-4 z-50 lg:hidden"
      onClick={onClick}
      aria-label="Toggle Sidebar"
    >
      <Menu className="h-4 w-4" />
    </Button>
  )
}
