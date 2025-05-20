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
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash } from "lucide-react"
import { getProjects, createProject, getTeams, type Project, type Team, type ProjectStatus } from "@/lib/firestore"
import { Timestamp, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function ProjectsContent() {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("planning")
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
  })

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch projects and teams
        const [projectsData, teamsData] = await Promise.all([
          getProjects(userRole === "user" ? user.uid : undefined),
          getTeams(),
        ])

        setProjects(projectsData)
        setTeams(teamsData)
      } catch (error) {
        console.error("Error fetching projects data:", error)
        setError("Failed to load projects. Please try again later.")
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

  const handleAddTeam = (teamId: string) => {
    if (!selectedTeams.includes(teamId)) {
      setSelectedTeams([...selectedTeams, teamId])
    }
  }

  const handleRemoveTeam = (teamId: string) => {
    setSelectedTeams(selectedTeams.filter((id) => id !== teamId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      setError(null)

      // Convert deadline string to Timestamp
      const deadlineDate = new Date(formData.deadline)

      await createProject({
        name: formData.name,
        description: formData.description,
        deadline: Timestamp.fromDate(deadlineDate),
        status: projectStatus,
        teams: selectedTeams,
        createdBy: user.uid,
      })

      // Refresh projects list
      const updatedProjects = await getProjects(userRole === "user" ? user.uid : undefined)
      setProjects(updatedProjects)

      // Reset form
      setFormData({
        name: "",
        description: "",
        deadline: "",
      })
      setSelectedTeams([])
      setProjectStatus("planning")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating project:", error)
      setError("Failed to create project. Please try again.")
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || "",
      deadline: project.deadline ? new Date(project.deadline.toDate()).toISOString().split("T")[0] : "",
    })
    setSelectedTeams(project.teams)
    setProjectStatus(project.status)
    setIsEditDialogOpen(true)
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !editingProject) return

    try {
      setError(null)

      // Convert deadline string to Timestamp
      const deadlineDate = new Date(formData.deadline)

      await updateDoc(doc(db, "projects", editingProject.id), {
        name: formData.name,
        description: formData.description,
        deadline: Timestamp.fromDate(deadlineDate),
        status: projectStatus,
        teams: selectedTeams,
        updatedAt: Timestamp.now(),
      })

      // Refresh projects list
      const updatedProjects = await getProjects(userRole === "user" ? user.uid : undefined)
      setProjects(updatedProjects)

      // Reset form
      setEditingProject(null)
      setFormData({
        name: "",
        description: "",
        deadline: "",
      })
      setSelectedTeams([])
      setProjectStatus("planning")
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating project:", error)
      setError("Failed to update project. Please try again.")
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return

    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return
    }

    try {
      setError(null)

      await deleteDoc(doc(db, "projects", projectId))

      // Refresh projects list
      const updatedProjects = await getProjects(userRole === "user" ? user.uid : undefined)
      setProjects(updatedProjects)
    } catch (error) {
      console.error("Error deleting project:", error)
      setError("Failed to delete project. Please try again.")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "planning":
      case "not-started":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "on-hold":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Helper function to get team names from team IDs
  const getTeamNames = (teamIds: string[]): string[] => {
    return teamIds.map((teamId) => {
      const team = teams.find((t) => t.id === teamId)
      return team ? team.name : "Unknown Team"
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your organization's projects</p>
        </div>
        {userRole === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                  <DialogDescription>Create a new project and assign teams to it.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={formData.description} onChange={handleInputChange} />
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
                      <Label htmlFor="status">Status</Label>
                      <Select value={projectStatus} onValueChange={(value) => setProjectStatus(value as ProjectStatus)}>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Assign Teams</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedTeams.map((teamId) => {
                        const team = teams.find((t) => t.id === teamId)
                        return (
                          <Badge key={teamId} variant="secondary" className="gap-1">
                            {team ? team.name : "Unknown Team"}
                            <button
                              type="button"
                              onClick={() => handleRemoveTeam(teamId)}
                              className="ml-1 rounded-full outline-none focus:ring-2"
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                    <Select onValueChange={handleAddTeam}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teams" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id} disabled={selectedTeams.includes(team.id)}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Project</Button>
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
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            {userRole === "admin" ? "Manage and track all projects" : "View your assigned projects"}
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
          ) : projects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  {userRole === "admin" && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getTeamNames(project.teams).map((teamName) => (
                          <Badge key={teamName} variant="outline">
                            {teamName}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.deadline ? project.deadline.toDate().toLocaleDateString() : "No deadline"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace("-", " ")}
                      </Badge>
                    </TableCell>
                    {userRole === "admin" && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditProject(project)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(project.id)}>
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
            <div className="py-6 text-center text-muted-foreground">No projects found</div>
          )}
        </CardContent>
      </Card>

      {/* Edit Project Dialog */}
      {editingProject && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleUpdateProject}>
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
                <DialogDescription>Update project details and team assignments.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Project Name</Label>
                  <Input id="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-deadline">Deadline</Label>
                    <Input id="deadline" type="date" value={formData.deadline} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={projectStatus} onValueChange={(value) => setProjectStatus(value as ProjectStatus)}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Assign Teams</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTeams.map((teamId) => {
                      const team = teams.find((t) => t.id === teamId)
                      return (
                        <Badge key={teamId} variant="secondary" className="gap-1">
                          {team ? team.name : "Unknown Team"}
                          <button
                            type="button"
                            onClick={() => handleRemoveTeam(teamId)}
                            className="ml-1 rounded-full outline-none focus:ring-2"
                          >
                            ×
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                  <Select onValueChange={handleAddTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teams" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id} disabled={selectedTeams.includes(team.id)}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Project</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
