import React from "react";
import { ProjectPriority } from "@/lib/firestore";
import { getPriorityBadge } from "@/app/projects/section/utils";
import { Badge } from "../ui/badge";

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
    <Badge
      className={`${priorityBadge.color} text-white text-xs py-0.5 px-2 capitalize shrink-0 ${className}`}
    >
      {priority}
    </Badge>
  );
};

export default BadgePriority;
