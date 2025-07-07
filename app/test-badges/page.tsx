"use client";

import React, { useEffect } from "react";
import { ProjectStatus, ProjectPriority } from "@/lib/firestore";
import BadgeStatus from "@/components/atomics/BadgeStatus.atomic";
import BadgePriority from "@/components/atomics/BadgePriority.atomic";
import { getStatusBadge, getPriorityBadge } from "@/lib/utils";

export default function TestBadgesPage() {
  useEffect(() => {
    // Log badge configurations to console for debugging
    console.log("Status Badge Configs:");
    console.log("Planning:", getStatusBadge(ProjectStatus.Planning));
    console.log("InProgress:", getStatusBadge(ProjectStatus.InProgress));
    console.log("Completed:", getStatusBadge(ProjectStatus.Completed));
    console.log("OnHold:", getStatusBadge(ProjectStatus.OnHold));

    console.log("Priority Badge Configs:");
    console.log("Low:", getPriorityBadge(ProjectPriority.Low));
    console.log("Medium:", getPriorityBadge(ProjectPriority.Medium));
    console.log("High:", getPriorityBadge(ProjectPriority.High));
  }, []);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Badge Test Page</h1>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Status Badges</h2>
        <div className="flex gap-4 flex-wrap">
          <BadgeStatus status={ProjectStatus.Planning} />
          <BadgeStatus status={ProjectStatus.InProgress} />
          <BadgeStatus status={ProjectStatus.Completed} />
          <BadgeStatus status={ProjectStatus.OnHold} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Priority Badges</h2>
        <div className="flex gap-4 flex-wrap">
          <BadgePriority priority={ProjectPriority.Low} />
          <BadgePriority priority={ProjectPriority.Medium} />
          <BadgePriority priority={ProjectPriority.High} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Raw Tailwind Classes Test</h2>
        <div className="flex gap-4 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white bg-blue-500">
            Blue Background
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white bg-yellow-500">
            Yellow Background
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white bg-green-500">
            Green Background
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white bg-red-500">
            Red Background
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white bg-gray-500">
            Gray Background
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Inline Style Test</h2>
        <div className="flex gap-4 flex-wrap">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: "#3b82f6" }}
          >
            Inline Blue
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: "#eab308" }}
          >
            Inline Yellow
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: "#22c55e" }}
          >
            Inline Green
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Debug Information</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p>
            <strong>Planning Status Badge Config:</strong>
          </p>
          <pre className="text-sm">
            {JSON.stringify(getStatusBadge(ProjectStatus.Planning), null, 2)}
          </pre>

          <p className="mt-4">
            <strong>High Priority Badge Config:</strong>
          </p>
          <pre className="text-sm">
            {JSON.stringify(getPriorityBadge(ProjectPriority.High), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
