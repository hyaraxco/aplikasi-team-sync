import { ProjectStatus, ProjectPriority } from "@/lib/firestore";
import { AlertCircle, Clock, CheckCircle2, PauseCircle } from "lucide-react";

export const getStatusBadge = (status: ProjectStatus) => {
  const statusConfig = {
    [ProjectStatus.Planning]: {
      color: "bg-blue-500",
      Icon: Clock,
    },
    [ProjectStatus.InProgress]: {
      color: "bg-yellow-500",
      Icon: AlertCircle,
    },
    [ProjectStatus.Completed]: {
      color: "bg-green-500",
      Icon: CheckCircle2,
    },
    [ProjectStatus.OnHold]: {
      color: "bg-gray-500",
      Icon: PauseCircle,
    },
  };

  return statusConfig[status] || { color: "bg-gray-500" };
};

export const getPriorityBadge = (priority: ProjectPriority) => {
  const priorityConfig = {
    [ProjectPriority.Low]: {
      color: "bg-blue-500",
    },
    [ProjectPriority.Medium]: {
      color: "bg-yellow-500",
    },
    [ProjectPriority.High]: {
      color: "bg-red-500",
    },
  };

  return priorityConfig[priority] || { color: "bg-gray-500" };
}; 