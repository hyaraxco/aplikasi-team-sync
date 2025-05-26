"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/molecules/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getRecentActivities,
  getUserActivities,
  type Activity,
  getUserData,
  type UserData,
} from "@/lib/firestore";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/atomics/Avatar.atomic";

export function ActivityFeed() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<Record<string, UserData>>({});

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);

        // Fetch activities based on user role
        let activitiesData: Activity[];

        if (userRole === "admin") {
          activitiesData = await getRecentActivities(10);
        } else {
          if (user) {
            activitiesData = await getUserActivities(user.uid, 10);
          } else {
            activitiesData = [];
          }
        }

        setActivities(activitiesData);

        // Fetch user data for each activity
        const userIds = [
          ...new Set(activitiesData.map((activity) => activity.userId)),
        ];
        const userDataPromises = userIds.map((userId) => getUserData(userId));
        const userDataResults = await Promise.all(userDataPromises);

        const usersMap: Record<string, UserData> = {};
        userDataResults.forEach((userData) => {
          if (userData) {
            usersMap[userData.id] = userData;
          }
        });

        setUsers(usersMap);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [user, userRole]);

  // Helper function to format activity message
  const formatActivityMessage = (activity: Activity): string => {
    switch (activity.type) {
      case "task":
        return `${activity.action} a task${activity.targetName ? ` "${activity.targetName}"` : ""}`;
      case "project":
        return `${activity.action} a project${activity.targetName ? ` "${activity.targetName}"` : ""}`;
      case "team":
        return `${activity.action} a team${activity.targetName ? ` "${activity.targetName}"` : ""}`;
      case "attendance":
        return activity.action;
      case "payroll":
        return `${activity.action} payroll${activity.targetName ? ` for ${activity.targetName}` : ""}`;
      default:
        return activity.action;
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "";

    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          {userRole === "admin"
            ? "Your team's recent activities"
            : "Your recent activities"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => {
              const userData = users[activity.userId];
              const userInitials = userData?.displayName
                ? userData.displayName.substring(0, 2).toUpperCase()
                : userData?.email.substring(0, 2).toUpperCase();

              return (
                <div key={activity.id} className="flex items-start gap-4">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={userData?.photoURL || ""}
                      alt={userData?.displayName || ""}
                    />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      <span className="font-semibold">
                        {userData?.displayName || userData?.email.split("@")[0]}
                      </span>{" "}
                      {formatActivityMessage(activity)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            No recent activities found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
