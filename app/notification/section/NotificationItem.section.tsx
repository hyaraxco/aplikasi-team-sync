"use client";

import type React from "react";
import {
  getActivityDisplayMessage,
  getNotificationTypeStyle,
} from "@/lib/helpers";
import { useAuth } from "@/components/auth-provider";
import { type Activity } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore"; // Import Timestamp

// Helper function for relative time (bisa dipindah ke utils jika dipakai di banyak tempat)
function formatRelativeTime(firebaseTimestamp: Timestamp | any): string {
  if (
    !(firebaseTimestamp instanceof Timestamp) &&
    !(
      firebaseTimestamp &&
      typeof firebaseTimestamp.seconds === "number" &&
      typeof firebaseTimestamp.nanoseconds === "number"
    )
  ) {
    return ""; // Not a valid Timestamp object yet
  }
  const date = new Date(
    firebaseTimestamp.seconds * 1000 + firebaseTimestamp.nanoseconds / 1000000
  );
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 5) return "just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return `yesterday`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

interface NotificationItemProps {
  notification: Activity;
}

export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  const { user } = useAuth();
  const isUnread = notification.status === "unread";

  const {
    icon: IconComponent,
    dotColor,
    titlePrefix,
  } = getNotificationTypeStyle(notification.type);

  // Menentukan Title
  let title = titlePrefix || "Notification";
  // Contoh sederhana untuk action, bisa diperluas
  if (notification.action) {
    const actionText = notification.action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    title = actionText.includes(title) ? actionText : `${title}: ${actionText}`;
  }

  const actorName =
    notification.userId && user && notification.userId === user.uid
      ? "You"
      : notification.details?.actorName || "Someone";

  const message = getActivityDisplayMessage(notification, actorName);
  const time = formatRelativeTime(notification.timestamp);

  return (
    <div
      className={
        `flex items-start gap-3 border-b p-4 last:border-b-0 transition-colors ` +
        (isUnread ? "bg-muted/10" : "bg-background") // Sedikit beda untuk unread
      }
    >
      <div className="relative flex-shrink-0 mt-1">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <IconComponent className="h-5 w-5 text-muted-foreground" />
        </div>
        {isUnread && (
          <span
            className={`absolute -top-1 -right-1 block h-3 w-3 rounded-full ${dotColor} border-2 border-background`}
          />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4
            className={`text-sm font-semibold ${isUnread ? "text-foreground" : "text-foreground/80"}`}
          >
            {title}
          </h4>
          {time && (
            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
              {time}
            </span>
          )}
        </div>
        <p
          className={`mt-0.5 text-sm ${isUnread ? "text-muted-foreground" : "text-muted-foreground/70"}`}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
