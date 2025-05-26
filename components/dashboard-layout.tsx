"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useSidebar } from "@/hooks/use-sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userRole, loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { isOpen } = useSidebar();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Redirect if not authenticated and not loading
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Handle loading state
  if (!isMounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Don't render the layout if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      {/* Main content area with fixed left margin on desktop */}
      <div className="flex flex-1 flex-col w-full lg:ml-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
