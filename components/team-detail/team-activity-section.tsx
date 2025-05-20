"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTeamActivities, getUserData, type Activity, type UserData } from "@/lib/firestore"

interface TeamActivitySectionProps {
  teamId: string
}

export function TeamActivitySection({ teamId }: TeamActivitySectionProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [users, setUsers] = useState<Record<string, UserData>>({})

  const fetchActivitiesData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch activities for this team
      const activitiesData = await getTeamActivities(teamId)

      // Sort activities by timestamp (newest first)
      activitiesData.sort((a, b) => {
        const dateA = a.timestamp?.toDate() || new Date(0)
        const dateB = b.timestamp?.toDate() || new Date(0)
        return dateB.getTime() - dateA.getTime()
      })

      setActivities(activitiesData)

      // Get unique user IDs from activities
      const userIds = [...new Set(activitiesData.map((activity) => activity.userId))]

      // Fetch user data for each user
      const usersMap: Record<string, UserData> = {}
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const userData = await getUserData(userId)
            if (userData) {
              usersMap[userId] = userData
            }
          } catch (err) {
            console.error(`Error fetching data for user ${userId}:`, err)
          }
        }),
      )

      setUsers(usersMap)
    } catch (error) {
      console.error("Error fetching team activities data:", error)
      setError("Failed to load team activities. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivitiesData()
  }, [teamId])

  // Helper function to format activity message
  const formatActivityMessage = (activity: Activity): string => {
    switch (activity.type) {
      case "task":
        return `${activity.action} a task${activity.targetName ? ` "${activity.targetName}"` : ""}`
      case "project":
        return `${activity.action} a project${activity.targetName ? ` "${activity.targetName}"` : ""}`
      case "team":
        return `${activity.action} the team${activity.targetName ? ` "${activity.targetName}"` : ""}`
      case "attendance":
        return activity.action
      case "payroll":
        return `${activity.action} payroll${activity.targetName ? ` for ${activity.targetName}` : ""}`
      default:
        return activity.action
    }
  }

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return ""

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`

      return date.toLocaleDateString()
    } catch (err) {
      console.error("Error formatting timestamp:", err)
      return "Unknown date"
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Recent team activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={fetchActivitiesData} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent team activity</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="relative pl-6 border-l space-y-6 max-h-[500px] overflow-y-auto pr-2">
            {activities.map((activity) => {
              const userData = users[activity.userId]
              const userInitials = userData?.displayName
                ? userData.displayName.substring(0, 2).toUpperCase()
                : userData?.email?.substring(0, 2).toUpperCase() || "??"

              return (
                <div key={activity.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-9 mt-1.5 h-4 w-4 rounded-full border bg-background"></div>

                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={userData?.photoURL || ""} alt={userData?.displayName || ""} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-none break-words">
                        <span className="font-semibold">
                          {userData?.displayName || userData?.email?.split("@")[0] || "Unknown User"}
                        </span>{" "}
                        {formatActivityMessage(activity)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{formatTimestamp(activity.timestamp)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent activity found for this team.</p>
            <Button variant="outline" onClick={fetchActivitiesData} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
