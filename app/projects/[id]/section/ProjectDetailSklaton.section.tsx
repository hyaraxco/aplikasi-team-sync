"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ProjectDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Content Skeleton (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          {/* TeamInfoCard Skeleton */}
          <Skeleton className="h-[220px] w-full rounded-lg" />

          {/* Tabs Skeleton */}
          <div>
            <Skeleton className="h-10 w-1/2 rounded-t-md" />
            <Skeleton className="h-[300px] w-full rounded-b-md" />
          </div>
        </div>

        {/* Sidebar Skeleton (Right Column) */}
        <div className="lg:col-span-1 space-y-6">
          {/* TeamStatsCard Skeleton */}
          <Skeleton className="h-[200px] w-full rounded-lg" />
          {/* RecentActivityCard Skeleton */}
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
