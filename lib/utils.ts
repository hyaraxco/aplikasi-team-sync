import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ProjectPriority, ProjectStatus } from "./firestore";
import { AlertCircle, Briefcase, CalendarDays, CheckCircle, FlagOff, Hourglass, CheckCircle2, Clock, PauseCircle } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// Function to format date with null/undefined handling
export function formatDate(timestamp: any): string {
  if (!timestamp) return "Not set"

  try {
    // Check if timestamp has toDate method (Firestore Timestamp)
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString()
    }

    // Handle Date objects
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString()
    }

    // Handle string dates
    if (typeof timestamp === "string") {
      return new Date(timestamp).toLocaleDateString()
    }

    return "Invalid date"
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid date"
  }
}


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