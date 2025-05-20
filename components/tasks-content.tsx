"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash } from "lucide-react"
import {
  getTasks,
  createTask,
  completeTask,
  getProjects,
  type Task,
  type Project,
  type UserData,
  type TaskStatus,
} from "@/lib/firestore"
import { Timestamp, collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function TasksContent() {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("not-started")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
    price: "0",
  })

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch tasks and projects
        const [tasksData, projectsData] = await Promise.all([
          getTasks(userRole === "user" ? user.uid : undefined),
          getProjects(),
        ])

        setTasks(tasksData)
        setProjects(projectsData)

        // For admin, fetch all users
        if (userRole === "admin") {
          const usersSnapshot = await getDocs(collection(db, "users"))
          const usersData = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as UserData)
          setUsers(usersData)
        }
      } catch (error) {
        console.error("Error fetching tasks data:", error)
        setError("Failed to load tasks. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, userRole])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      setError(null)

      // Convert deadline string to Timestamp
      const deadlineDate = new Date(formData.deadline)

      await createTask({
        name: formData.name,
        description: formData.description,
        projectId: selectedProject,
        assignedTo: selectedUser,
        status: taskStatus,
        deadline: Timestamp.fromDate(deadlineDate),
        price: Number.parseFloat(formData.price),
        createdBy: user.uid,
      })

      // Refresh tasks list
      const updatedTasks = await getTasks(userRole === "user" ? user.uid : undefined)
      setTasks(updatedTasks)

      // Reset form
      setFormData({
        name: "",
        description: "",
        deadline: "",
        price: "0",
      })
      setSelectedProject("")
      setSelectedUser("")
      setTaskStatus("not-started")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating task:", error)
      setError("Failed to create task. Please try again.")
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setFormData({
      name: task.name,
      description: task.description || "",
      deadline: task.deadline ? new Date(task.deadline.toDate()).toISOString().split("T")[0] : "",
      price: task.price.toString(),
    })
    setSelectedProject(task.projectId)
    setSelectedUser(task.assignedTo)
    setTaskStatus(task.status)
    setIsEditDialogOpen(true)
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !editingTask) return

    try {
      setError(null)

      // Convert deadline string to Timestamp
      const deadlineDate = new Date(formData.deadline)

      await updateDoc(doc(db, "tasks", editingTask.id), {
        name: formData.name,
        description: formData.description,
        projectId: selectedProject,
        assignedTo: selectedUser,
        status: taskStatus,
        deadline: Timestamp.fromDate(deadlineDate),
        price: Number.parseFloat(formData.price),
        updatedAt: Timestamp.now(),
      })

      // Refresh tasks list
      const updatedTasks = await getTasks(userRole === "user" ? user.uid : undefined)
      setTasks(updatedTasks)

      // Reset form
      setEditingTask(null)
      setFormData({
        name: "",
        description: "",
        deadline: "",
        price: "0",
      })
      setSelectedProject("")
      setSelectedUser("")
      setTaskStatus("not-started")
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating task:", error)
      setError("Failed to update task. Please try again.")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return

    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return
    }

    try {
      setError(null)

      await deleteDoc(doc(db, "tasks", taskId))

      // Refresh tasks list
      const updatedTasks = await getTasks(userRole === "user" ? user.uid : undefined)
      setTasks(updatedTasks)
    } catch (error) {
      console.error("Error deleting task:", error)
      setError("Failed to delete task. Please try again.")
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return

    try {
      setError(null)

      await completeTask(taskId, user.uid)

      // Refresh tasks list
      const updatedTasks = await getTasks(userRole === "user" ? user.uid : undefined)
      setTasks(updatedTasks)
    } catch (error) {
      console.error("Error completing task:", error)
      setError("Failed to complete task. Please try again.")
    }
  }

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

  // Helper function to get project name from project ID
  const getProjectName = (projectId: string): string => {
    const project = projects.find((p) => p.id === projectId)
    return project ? project.name : "Unknown Project"
  }

  // Helper function to get user name from user ID
  const getUserName = (userId: string): string => {
    const user = users.find((u) => u.id === userId)
    return user ? user.displayName || user.email : "Unknown User"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            {userRole === "admin" ? "Manage and assign tasks" : "View and complete your tasks"}
          </p>
        </div>
        {userRole === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                  <DialogDescription>Create a new task and assign it to a team member.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Task Name</Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={formData.description} onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="project">Project</Label>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger id="project">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="assignee">Assign To</Label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger id="assignee">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.displayName || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Task Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={taskStatus} onValueChange={(value) => setTaskStatus(value as TaskStatus)}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Task</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{userRole === "admin" ? "All Tasks" : "Your Tasks"}</CardTitle>
          <CardDescription>
            {userRole === "admin" ? "Manage and track all tasks" : "View and complete your assigned tasks"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
          ) : tasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {userRole === "user" && <TableHead className="w-[50px]"></TableHead>}
                  <TableHead>Name</TableHead>
                  {userRole === "admin" && <TableHead>Assigned To</TableHead>}
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Price</TableHead>
                  {userRole === "admin" && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    {userRole === "user" && (
                      <TableCell>
                        <Checkbox
                          disabled={task.status === "completed"}
                          checked={task.status === "completed"}
                          onCheckedChange={() => handleCompleteTask(task.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{task.name}</TableCell>
                    {userRole === "admin" && <TableCell>{getUserName(task.assignedTo)}</TableCell>}
                    <TableCell>{getProjectName(task.projectId)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.deadline ? task.deadline.toDate().toLocaleDateString() : "No deadline"}</TableCell>
                    <TableCell>${task.price.toFixed(2)}</TableCell>
                    {userRole === "admin" && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-6 text-center text-muted-foreground">No tasks found</div>
          )}
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleUpdateTask}>
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>Update task details and assignments.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Task Name</Label>
                  <Input id="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-project">Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger id="project">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-assignee">Assign To</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger id="assignee">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.displayName || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-deadline">Deadline</Label>
                    <Input id="deadline" type="date" value={formData.deadline} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Task Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={taskStatus} onValueChange={(value) => setTaskStatus(value as TaskStatus)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Task</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
