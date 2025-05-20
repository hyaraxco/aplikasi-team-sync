"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTeamTasks, getUserData, type Task, type TeamMember } from "@/lib/firestore"

interface TeamTasksSectionProps {
  teamId: string
  teamMembers: TeamMember[]
}

export function TeamTasksSection({ teamId, teamMembers }: TeamTasksSectionProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Array<Task & { assigneeName: string }>>([])
  const [filteredTasks, setFilteredTasks] = useState<Array<Task & { assigneeName: string }>>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [assignees, setAssignees] = useState<Record<string, string>>({})

  const fetchTasksData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch tasks for this team
      const tasksData = await getTeamTasks(teamId)

      if (tasksData.length === 0) {
        setTasks([])
        setFilteredTasks([])
        setLoading(false)
        return
      }

      // Get unique assignee IDs
      const assigneeIds = [...new Set(tasksData.map((task) => task.assignedTo))]

      // Fetch user data for each assignee
      const assigneeMap: Record<string, string> = {}
      await Promise.all(
        assigneeIds.map(async (userId) => {
          const userData = await getUserData(userId)
          if (userData) {
            assigneeMap[userId] = userData.displayName || userData.email || userId
          } else {
            assigneeMap[userId] = "Unknown User"
          }
        }),
      )

      setAssignees(assigneeMap)

      // Add assignee names to tasks
      const tasksWithAssigneeNames = tasksData.map((task) => ({
        ...task,
        assigneeName: assigneeMap[task.assignedTo] || "Unknown User",
      }))

      setTasks(tasksWithAssigneeNames)
      setFilteredTasks(tasksWithAssigneeNames)
    } catch (error) {
      console.error("Error fetching team tasks data:", error)
      setError("Failed to load team tasks. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasksData()
  }, [teamId, teamMembers])

  // Apply filters when they change
  useEffect(() => {
    let result = [...tasks]

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter)
    }

    // Apply assignee filter
    if (assigneeFilter !== "all") {
      result = result.filter((task) => task.assignedTo === assigneeFilter)
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.assigneeName.toLowerCase().includes(query),
      )
    }

    setFilteredTasks(result)
  }, [statusFilter, assigneeFilter, searchQuery, tasks])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "not-started":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Tasks</CardTitle>
          <CardDescription>Tasks assigned to team members</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTasksData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="grid w-full md:w-1/3 items-center gap-1.5">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid w-full md:w-1/3 items-center gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full md:w-1/3 items-center gap-1.5">
            <Label htmlFor="assignee">Assignee</Label>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Filter by assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {Object.entries(assignees).map(([userId, name]) => (
                  <SelectItem key={userId} value={userId}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{task.name}</div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{task.assigneeName}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.deadline ? task.deadline.toDate().toLocaleDateString() : "No deadline"}</TableCell>
                    <TableCell className="text-right">${task.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tasks found matching the current filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
