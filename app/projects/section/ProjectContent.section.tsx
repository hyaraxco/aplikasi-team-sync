"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/atomics/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/molecules/dialog";
import { Input } from "@/components/atomics/input";
import { Label } from "@/components/atomics/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import ProjectCard from "./ProjectCard.section"; // Import the new ProjectCard

import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

import { Plus, CalendarIcon, CircleX } from "lucide-react";
import {
  getProjects,
  createProject,
  getTeams,
  type Project,
  type Team,
  ProjectStatus,
  ProjectPriority,
  getTeamProjects,
  getTeamTasks,
  getTeamMetrics,
} from "@/lib/firestore";
import ProjectFilterBar, {
  type ProjectFilters,
  type ProjectSortField,
} from "./ProjectFilterBar.section";
import { Timestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/atomics/popover";
import { Calendar } from "@/components/molecules/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { EmptyState } from "@/components/common/data-display/EmptyState";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/molecules/Alert.molecule";

export function ProjectsContent() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>(
    ProjectStatus.Planning
  );
  const [projectPriority, setProjectPriority] = useState<ProjectPriority>(
    ProjectPriority.Low
  );
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    deadline?: Date;
  }>({
    name: "",
    description: "",
    deadline: undefined,
  });

  // State for ProjectFilterBar
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilters, setProjectFilters] = useState<ProjectFilters>({
    teamIds: [],
    status: [],
  });
  const [projectSortField, setProjectSortField] =
    useState<ProjectSortField>("name");
  const [projectSortDirection, setProjectSortDirection] = useState<
    "asc" | "desc"
  >("asc");

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch projects and teams
        const projectsData = await getProjects();
        const teamsData = await getTeams();

        // Fetch metrics for each project's teams
        const projectsWithMetrics = await Promise.all(
          projectsData.map(async (project) => {
            if (project.teams && project.teams.length > 0) {
              const teamMetricsPromises = project.teams.map((teamId) =>
                getTeamMetrics(teamId)
              );
              const teamMetrics = await Promise.all(teamMetricsPromises);

              // Calculate total metrics for project
              const totalTasks = teamMetrics.reduce(
                (sum, metrics) => sum + (metrics?.totalTasks || 0),
                0
              );
              const completedTasks = teamMetrics.reduce(
                (sum, metrics) => sum + (metrics?.completedTasks || 0),
                0
              );

              return {
                ...project,
                metrics: {
                  totalTasks,
                  completedTasks,
                  completionRate:
                    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
                },
              };
            }
            return project;
          })
        );

        setProjects(projectsWithMetrics);
        setTeams(teamsData);
      } catch (error) {
        console.error("Error fetching projects data:", error);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, userRole]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddTeam = (teamId: string) => {
    if (!selectedTeams.includes(teamId)) {
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handleRemoveTeam = (teamId: string) => {
    setSelectedTeams(selectedTeams.filter((id) => id !== teamId));
  };

  const handleDeadlineChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, deadline: date }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setError(null);
      if (!formData.deadline) {
        setError("Deadline is required.");
        return;
      }

      await createProject({
        name: formData.name,
        description: formData.description,
        deadline: Timestamp.fromDate(formData.deadline),
        status: projectStatus,
        teams: selectedTeams,
        createdBy: user.uid,
        priority: projectPriority,
      });

      // Refresh projects list
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);

      // Reset form
      setFormData({
        name: "",
        description: "",
        deadline: undefined,
      });
      setSelectedTeams([]);
      setProjectStatus(ProjectStatus.Planning);
      setProjectPriority(ProjectPriority.Low);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating project:", error);
      setError("Failed to create project. Please try again.");
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      deadline: project.deadline ? project.deadline.toDate() : undefined,
    });
    setSelectedTeams(project.teams);
    setProjectStatus(project.status);
    setProjectPriority(project.priority); // Set priority for editing
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !editingProject) return;

    try {
      setError(null);

      if (!formData.deadline) {
        setError("Deadline is required.");
        return;
      }

      await updateDoc(doc(db, "projects", editingProject.id), {
        name: formData.name,
        description: formData.description,
        deadline: Timestamp.fromDate(formData.deadline),
        status: projectStatus,
        priority: projectPriority, // Add priority here
        teams: selectedTeams,
        updatedAt: Timestamp.now(),
      });

      // Refresh projects list
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);

      // Reset form
      setEditingProject(null);
      setFormData({
        name: "",
        description: "",
        deadline: undefined,
      });
      setSelectedTeams([]);
      setProjectStatus(ProjectStatus.Planning);
      setProjectPriority(ProjectPriority.Low); // Also reset priority
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating project:", error);
      setError("Failed to update project. Please try again.");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return;

    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setError(null);

      await deleteDoc(doc(db, "projects", projectId));

      // Refresh projects list
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);
    } catch (error) {
      console.error("Error deleting project:", error);
      setError("Failed to delete project. Please try again.");
    }
  };

  // Handlers for ProjectFilterBar
  const handleProjectSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleProjectFilterChange = (
    type: keyof ProjectFilters,
    value: string
  ) => {
    setProjectFilters((prev) => {
      const newValues = prev[type].includes(value as ProjectStatus)
        ? prev[type].filter((item) => item !== value)
        : [...prev[type], value as ProjectStatus];
      return { ...prev, [type]: newValues };
    });
  };

  const handleProjectSortFieldChange = (field: ProjectSortField) => {
    setProjectSortField(field);
  };

  const handleProjectSortDirectionChange = (direction: "asc" | "desc") => {
    setProjectSortDirection(direction);
  };

  const clearProjectFilters = () => {
    setSearchTerm("");
    setProjectFilters({ status: [], teamIds: [] });
    // Reset sort to default if desired
    // setProjectSortField("name");
    // setProjectSortDirection("asc");
  };

  const applyProjectFiltersAndSort = () => {
    let filtered = [...projects];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(term) ||
          (project.description &&
            project.description.toLowerCase().includes(term))
      );
    }

    // Apply status filters
    if (projectFilters.status.length > 0) {
      filtered = filtered.filter((project) =>
        projectFilters.status.includes(project.status)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      const valA = a[projectSortField];
      const valB = b[projectSortField];

      if (projectSortField === "deadline") {
        const dateA = a.deadline ? a.deadline.toDate().getTime() : 0;
        const dateB = b.deadline ? b.deadline.toDate().getTime() : 0;
        if (dateA < dateB) comparison = -1;
        if (dateA > dateB) comparison = 1;
      } else {
        if (typeof valA === "string" && typeof valB === "string") {
          comparison = valA.localeCompare(valB);
        } else {
          if (valA < valB) comparison = -1;
          if (valA > valB) comparison = 1;
        }
      }
      return projectSortDirection === "asc" ? comparison : comparison * -1;
    });
    return filtered;
  };

  const displayedProjects = applyProjectFiltersAndSort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title="Projects"
            description={
              userRole === "admin"
                ? "Manage your organization's projects"
                : "View and track your projects"
            }
          />
        </div>
        {userRole === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                  <DialogDescription>
                    Create a new project and assign teams to it.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.deadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.deadline ? (
                              format(formData.deadline, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.deadline}
                            onSelect={handleDeadlineChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={projectStatus}
                        onValueChange={(value) =>
                          setProjectStatus(value as ProjectStatus)
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ProjectStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() +
                                status.slice(1).replace("-", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={projectPriority}
                      onValueChange={(value) =>
                        setProjectPriority(value as ProjectPriority)
                      }
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ProjectPriority).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority.charAt(0).toUpperCase() +
                              priority.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Assign Teams</Label>
                    <Select onValueChange={handleAddTeam}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teams" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem
                            key={team.id}
                            value={team.id}
                            disabled={selectedTeams.includes(team.id)}
                          >
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeams.map((teamId) => {
                        const team = teams.find((t) => t.id === teamId);
                        return (
                          <Badge
                            key={teamId}
                            variant="secondary"
                            className="gap-1"
                          >
                            {team ? team.name : "Unknown Team"}
                            <button
                              type="button"
                              onClick={() => handleRemoveTeam(teamId)}
                              className="ml-1 rounded-full outline-none focus:ring-2"
                            >
                              <CircleX className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
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

      <ProjectFilterBar
        searchTerm={searchTerm}
        onSearchChange={handleProjectSearchChange}
        filters={projectFilters}
        onFilterChange={handleProjectFilterChange}
        sortField={projectSortField}
        sortDirection={projectSortDirection}
        onSortFieldChange={handleProjectSortFieldChange}
        onSortDirectionChange={handleProjectSortDirectionChange}
        onClearFilters={clearProjectFilters}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <div className="p-6">
                  <div className="flex flex-col gap-6">
                    <div>
                      <Skeleton className="h-6 w-40" />
                      <div className="flex items-center mt-1">
                        <Skeleton className="h-4 w-4 rounded-full mr-1" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>

                    <Skeleton className="h-4 w-full" />

                    <div className="flex justify-between text-sm">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>

                    <Skeleton className="h-2 w-full" />

                    <div className="flex justify-between text-sm">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>

                    <div className="flex -space-x-2">
                      {Array(4)
                        .fill(0)
                        .map((_, j) => (
                          <Skeleton
                            key={j}
                            className="h-8 w-8 rounded-full border-2 border-background"
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : displayedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              // onClick={() => navigateToProjectDetail(project.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects found"
          description={
            searchTerm
              ? "No projects found matching your search."
              : projectFilters.status.length > 0
                ? "No projects found with the selected status."
                : "No projects have been created yet, or you don't have access to any."
          }
        />
      )}

      {/* Edit Project Dialog */}
      {/* {editingProject && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleUpdateProject}>
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
                <DialogDescription>
                  Update project details and team assignments.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-deadline">Deadline</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.deadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.deadline ? (
                            format(formData.deadline, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.deadline}
                          onSelect={handleDeadlineChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={projectStatus}
                      onValueChange={(value) =>
                        setProjectStatus(value as ProjectStatus)
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ProjectStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() +
                              status.slice(1).replace("-", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={projectPriority}
                    onValueChange={(value) =>
                      setProjectPriority(value as ProjectPriority)
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ProjectPriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label>Assign Teams</Label>
                  <Select onValueChange={handleAddTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teams" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem
                          key={team.id}
                          value={team.id}
                          disabled={selectedTeams.includes(team.id)}
                        >
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                      {selectedTeams.map((teamId) => {
                        const team = teams.find((t) => t.id === teamId);
                        return (
                          <Badge
                            key={teamId}
                            variant="secondary"
                            className="gap-1"
                          >
                            {team ? team.name : "Unknown Team"}
                            <button
                              type="button"
                              onClick={() => handleRemoveTeam(teamId)}
                              className="ml-1 rounded-full outline-none focus:ring-2"
                            >
                              <CircleX className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Project</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )} */}
    </div>
  );
}
