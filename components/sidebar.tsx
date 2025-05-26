"use client";

import type React from "react";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atomics/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth-provider";
import {
  BarChart,
  Calendar,
  CreditCard,
  Home,
  Settings,
  Users,
  X,
  Briefcase,
  CheckSquare,
} from "lucide-react";
// import { SidebarToggle } from "@/components/sidebar-toggle"
import { useSidebar } from "@/hooks/use-sidebar";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { userRole } = useAuth();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [pathname, setIsOpen]);

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Projects",
      icon: Briefcase,
      href: "/projects",
      active: pathname === "/projects",
    },
    {
      label: "Tasks",
      icon: CheckSquare,
      href: "/tasks",
      active: pathname === "/tasks",
    },
    {
      label: "Teams",
      icon: Users,
      href: "/teams",
      active: pathname === "/teams",
    },
    {
      label: "Attendance",
      icon: Calendar,
      href: "/attendance",
      active: pathname === "/attendance",
    },
    {
      label: "Payroll",
      icon: CreditCard,
      href: "/payroll",
      active: pathname === "/payroll",
    },
    {
      label: "Reports",
      icon: BarChart,
      href: "/reports",
      active: pathname === "/reports",
      adminOnly: true,
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      active: pathname === "/settings",
    },
  ];

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* <SidebarToggle onClick={toggleSidebar} /> */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
            onClick={(e) => handleNavigation("/dashboard", e)}
          >
            <span className="text-xl">TeamSync</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="px-3 py-2">
            <nav className="flex flex-col gap-1">
              {routes.map((route) => {
                if (route.adminOnly && userRole !== "admin") {
                  return null;
                }

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={(e) => handleNavigation(route.href, e)}
                    aria-current={route.active ? "page" : undefined}
                  >
                    <Button
                      variant={route.active ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        route.active ? "bg-secondary" : ""
                      )}
                    >
                      <route.icon className="mr-2 h-4 w-4" />
                      {route.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
