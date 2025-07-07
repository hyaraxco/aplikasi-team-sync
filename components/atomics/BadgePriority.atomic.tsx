import React from "react";
import { cn } from "@/lib/utils";
import { ProjectPriority } from "@/lib/firestore";
import { getPriorityBadge } from "@/lib/utils";

interface BadgePriorityProps {
  priority: ProjectPriority;
  className?: string;
}

export const BadgePriority = ({
  priority,
  className = "",
}: BadgePriorityProps) => {
  const priorityBadge = getPriorityBadge(priority);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white capitalize shrink-0",
        priorityBadge.color,
        className
      )}
      style={{ backgroundColor: priorityBadge.hexColor }}
    >
      {priority}
    </span>
  );
};

export default BadgePriority;
