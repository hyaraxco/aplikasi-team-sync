import React from "react";

import { ProjectStatus } from "@/lib/firestore";
import { getStatusBadge } from "@/app/projects/section/utils";
import { Badge } from "../ui/badge";

interface BadgeStatusProps {
  status: ProjectStatus;
  className?: string;
}

export const BadgeStatus = ({ status, className = "" }: BadgeStatusProps) => {
  const statusBadge = getStatusBadge(status);

  return (
    <Badge
      className={`${statusBadge.color} text-white text-xs py-0.5 px-2 capitalize flex items-center gap-1 ${className}`}
    >
      {statusBadge.Icon && <statusBadge.Icon className="h-3 w-3" />}
      {status.replace("-", " ")}
    </Badge>
  );
};

export default BadgeStatus;
