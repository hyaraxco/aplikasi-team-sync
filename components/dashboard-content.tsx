"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityFeed } from "@/components/activity-feed"
import { Briefcase, CheckSquare, Clock, DollarSign } from "lucide-react"
import {
  getTasks,
  getProjects,
  getAttendanceRecords,
  getPayrollRecords,
  type Task,
  type Project,
} from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DashboardContent() {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User"

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch tasks and projects based on user role
        if (userRole === "admin") {
          const [tasksData, projectsData] = await Promise.all([getTasks(), getProjects()])
          setTasks(tasksData)
          setProjects(projectsData)

          // For admin, calculate total earnings across all users
          const payrollRecords = await getPayrollRecords()
          const totalEarnings = payrollRecords.reduce((sum, record) => sum + record.totalEarnings, 0)
          setTotalEarnings(totalEarnings)
        } else {
          // For regular users, only fetch their assigned tasks and calculate their earnings
          if (user) {
            const [tasksData, projectsData, attendanceRecords] = await Promise.all([
              getTasks(user.uid),
              getProjects(user.uid),
              getAttendanceRecords(user.uid),
            ])
            setTasks(tasksData)
            setProjects(projectsData)

            // Calculate total earnings from completed tasks
            const taskEarnings = tasksData
              .filter((t) => t.status === "completed")
              .reduce((sum, task) => sum + task.price, 0)

            // Calculate total earnings from attendance
            const attendanceEarnings = attendanceRecords.reduce((sum, record) => sum + (record.earnings || 0), 0)

            setTotalEarnings(taskEarnings + attendanceEarnings)
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, userRole])

  // Calculate dashboard metrics
  const activeProjects = projects.filter((p) => p.status === "in-progress").length
  const pendingTasks = tasks.filter((t) => t.status === "not-started" || t.status === "in-progress").length
  const completedTasks = tasks.filter((t) => t.status === "completed").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {displayName}!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your {userRole === "admin" ? "team's" : "personal"} activity
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {activeProjects > 0
                    ? `${activeProjects} active project${activeProjects !== 1 ? "s" : ""}`
                    : "No active projects"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{pendingTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingTasks > 0
                    ? `${pendingTasks} pending task${pendingTasks !== 1 ? "s" : ""}`
                    : "No pending tasks"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{completedTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {completedTasks > 0
                    ? `${completedTasks} completed task${completedTasks !== 1 ? "s" : ""}`
                    : "No completed tasks"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {userRole === "admin" ? "Team total earnings" : "From completed tasks and attendance"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ActivityFeed />
    </div>
  )
}
