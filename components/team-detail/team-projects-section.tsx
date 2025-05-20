"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Calendar } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { getTeamProjects, getTeamTasks, type Project } from "@/lib/firestore"
import { useRouter } from "next/navigation"

interface TeamProjectsSectionProps {
  teamId: string
}

export function TeamProjectsSection({ teamId }: TeamProjectsSectionProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Array<Project & { taskCount: number; completedTaskCount: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        setError(null)

        // Fetch projects specifically for this team
        const teamProjects = await getTeamProjects(teamId)

        // For each project, get task counts
        const projectsWithTaskCounts = await Promise.all(
          teamProjects.map(async (project) => {
            const tasks = await getTeamTasks(teamId, project.id)
            const taskCount = tasks.length
            const completedTaskCount = tasks.filter((task) => task.status === "completed").length

            return {
              ...project,
              taskCount,
              completedTaskCount,
            }
          }),
        )

        setProjects(projectsWithTaskCounts)
      } catch (error) {
        console.error("Error fetching team projects:", error)
        setError("Failed to load projects. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [teamId])

  // Function to get status badge color
  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "planning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "on-hold":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Function to format date with null/undefined handling
  function formatDate(timestamp: any): string {
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

  // Calculate completion percentage safely
  function getCompletionPercentage(completed: number, total: number) {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Projects</CardTitle>
          <CardDescription>Projects assigned to this team</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Projects</CardTitle>
        <CardDescription>Projects assigned to this team</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => {
              const completionPercentage = getCompletionPercentage(project.completedTaskCount, project.taskCount)

              return (
                <div key={project.id} className="p-4 border rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <h3 className="text-lg font-medium mb-2 md:mb-0">{project.name || "Unnamed Project"}</h3>
                    <Badge className={getStatusColor(project.status || "unknown")}>
                      {project.status
                        ? project.status.charAt(0).toUpperCase() + project.status.slice(1).replace("-", " ")
                        : "Unknown Status"}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description || "No description provided"}
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline: {formatDate(project.deadline)}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {project.completedTaskCount} of {project.taskCount} tasks completed
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No projects found for this team.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
