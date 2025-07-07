"use client";

import { useState, useEffect } from "react";
import { Bell as BellIcon } from "lucide-react";
import { Button } from "@/components/atomics/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atomics/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/data-display/EmptyState";
import Link from "next/link";
import { db } from "@/lib/firebase"; // Only db, auth will be from useAuth
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";
import { type Activity, markAllActivitiesAsRead } from "@/lib/firestore";
import {
  getActivityDisplayMessage,
  getNotificationTypeStyle,
} from "@/lib/helpers";
import { useAuth } from "@/components/auth-provider"; // Import useAuth

// Helper function for relative time
function formatRelativeTime(firebaseTimestamp: Timestamp | any): string {
  if (
    !(firebaseTimestamp instanceof Timestamp) &&
    !(
      firebaseTimestamp &&
      typeof firebaseTimestamp.seconds === "number" &&
      typeof firebaseTimestamp.nanoseconds === "number"
    )
  ) {
    return "";
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
  return date.toLocaleDateString();
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Activity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { user, userRole } = useAuth(); // Gunakan useAuth

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    let firestoreQuery;

    if (userRole === "admin") {
      firestoreQuery = query(
        collection(db, "activities"),
        where("status", "==", "unread"),
        orderBy("timestamp", "desc")
        // Mungkin perlu limit() jika admin punya banyak notif unread, misal limit(50)
      );
    } else {
      firestoreQuery = query(
        collection(db, "activities"),
        where("userId", "==", user.uid),
        where("status", "==", "unread"),
        orderBy("timestamp", "desc")
      );
    }

    const unsub = onSnapshot(
      firestoreQuery,
      async (snap) => {
        const activities = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as Activity[];

        setNotifications(activities.slice(0, 5)); // Tampilkan 5 notifikasi unread teratas
        setUnreadCount(activities.length); // Jumlah total unread sesuai query
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications for panel:", error);
        setLoading(false);
        setNotifications([]);
        setUnreadCount(0);
      }
    );

    return () => unsub();
  }, [user, userRole, open]);

  const handleMarkAllRead = async () => {
    if (!user) return;

    if (userRole === "admin") {
      // Mark all system unread activities as read
      const q = query(
        collection(db, "activities"),
        where("status", "==", "unread")
      );
      try {
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.forEach((docSnap) => {
          // docSnap otomatis any jika tidak ada tipe eksplisit, tapi aman di sini
          batch.update(doc(db, "activities", docSnap.id), { status: "read" });
        });
        await batch.commit();
      } catch (error) {
        console.error("Error marking all system activities as read:", error);
      }
    } else {
      // Mark all unread activities for the current employee
      await markAllActivitiesAsRead(user.uid);
    }
    // onSnapshot will automatically refresh the data and UI
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full w-10 h-10 flex-shrink-0"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 sm:w-96" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[calc(80vh-10rem)] overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="relative h-8 w-8 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-2.5 w-1/4 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={<BellIcon className="w-6 h-6 text-muted-foreground" />}
              title={
                userRole === "admin"
                  ? "No unread system notifications"
                  : "No new notifications"
              }
              description={
                userRole === "admin"
                  ? "All system activities are read."
                  : "You're all caught up!"
              }
            />
          ) : (
            <div>
              {notifications.map((notif) => {
                const {
                  icon: IconComponent,
                  dotColor,
                  titlePrefix,
                } = getNotificationTypeStyle(notif.type);

                let title = titlePrefix || "Notification";
                if (notif.action) {
                  const actionText = notif.action
                    .split("_")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ");
                  title = actionText.includes(title)
                    ? actionText
                    : `${title}: ${actionText}`;
                }

                const actorName =
                  notif.userId && user && notif.userId === user.uid
                    ? "You"
                    : notif.details?.actorName || "Someone";
                const message = getActivityDisplayMessage(notif, actorName);
                const time = formatRelativeTime(notif.timestamp);
                const isUnread = notif.status === "unread";

                return (
                  <Link
                    href={`/notification?activityId=${notif.id}`}
                    key={notif.id}
                    className="block hover:bg-muted/50"
                    onClick={() => setOpen(false)}
                  >
                    <div
                      className={`flex items-start gap-3 p-3 border-b last:border-b-0`}
                    >
                      <div className="relative flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {isUnread && (
                          <span
                            className={`absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full ${dotColor} border-2 border-background`}
                          />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-baseline justify-between">
                          <h5
                            className={`text-sm font-medium truncate text-foreground`}
                          >
                            {title}
                          </h5>
                          {time && (
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                              {time}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate text-muted-foreground`}>
                          {message}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t p-2">
          <Link
            href="/notification"
            className="block"
            onClick={() => setOpen(false)}
          >
            <Button variant="ghost" size="sm" className="w-full justify-center">
              View all notifications
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
