"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/card";
import type { Project } from "@/lib/firestore";
import ProjectFilterBar from "./ProjectFilterBar";
import { useState, useEffect, useCallback } from "react";
import { AddExistingProjectDialog } from "./AddProject.section";
import { useAuth } from "@/components/auth-provider";
import ProjectCard from "@/app/projects/section/ProjectCard.section";
import { removeTeamFromProject, getTeamProjects } from "@/lib/firestore";
import { DeleteProjectDialog } from "./DeleteProject.section";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/atomics/Button.atomic";
import { EmptyState } from "@/components/common/data-display/EmptyState";
import { FolderKanban } from "lucide-react";

interface ProjectsTableProps {
  projects: Project[];
  teamId: string;
  teamName: string;
  onDataRefresh?: () => void;
}

export function ProjectsTable({
  projects: initialProjects,
  teamId,
  teamName,
  onDataRefresh,
}: ProjectsTableProps) {
  const { userRole } = useAuth ? useAuth() : { userRole: undefined };
  const isAdmin = userRole === "admin";
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [projectToRemove, setProjectToRemove] = useState<Project | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [sort, setSort] = useState<string>("newest");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProjectAdded = () => {
    setRefreshKey((k) => k + 1);
    if (onDataRefresh) onDataRefresh();
  };

  const handleRemoveProject = (project: Project) => {
    setProjectToRemove(project);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveProject = async () => {
    if (!projectToRemove) return;
    setIsRemoving(true);
    try {
      await removeTeamFromProject(projectToRemove.id, teamId);
      setIsRemoveDialogOpen(false);
      setProjectToRemove(null);
      handleProjectAdded();
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      // Error handling bisa ditambah jika ingin
    }
    setIsRemoving(false);
  };

  // Fetch ulang project setiap kali refreshKey berubah
  const fetchProjects = useCallback(async () => {
    const data = await getTeamProjects(teamId);
    setProjects(data);
  }, [teamId]);
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, refreshKey]);

  // Proses filter, search, dan sort
  let filteredProjects = projects;
  // Search
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filteredProjects = filteredProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }
  // Filter status (multi-select)
  if (filterStatus.length > 0) {
    filteredProjects = filteredProjects.filter((p) =>
      filterStatus.includes(p.status)
    );
  }
  // Sort
  if (sort === "newest") {
    filteredProjects = filteredProjects
      .slice()
      .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  } else if (sort === "name") {
    filteredProjects = filteredProjects
      .slice()
      .sort((a, b) =>
        sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
  } else if (sort === "status") {
    filteredProjects = filteredProjects
      .slice()
      .sort((a, b) =>
        sortDir === "asc"
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status)
      );
  } else if (sort === "progress") {
    filteredProjects = filteredProjects.slice().sort((a, b) => {
      const aProg = a.metrics?.completionRate || 0;
      const bProg = b.metrics?.completionRate || 0;
      return sortDir === "asc" ? aProg - bProg : bProg - aProg;
    });
  } else if (sort === "deadline") {
    filteredProjects = filteredProjects.slice().sort((a, b) => {
      const aTime = a.deadline?.seconds || 0;
      const bTime = b.deadline?.seconds || 0;
      return sortDir === "asc" ? aTime - bTime : bTime - aTime;
    });
  }

  // Handler untuk multi-select status
  const handleStatusChange = (status: string) => {
    setFilterStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  // Handler clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus([]);
    setSort("newest");
  };

  // Handler sort (toggle direction)
  const handleSortChange = (field: string) => {
    if (sort === field) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-4">
      <ProjectFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onStatusChange={handleStatusChange}
        sort={sort}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        onAddProject={
          isAdmin ? () => setIsAddProjectDialogOpen(true) : undefined
        }
        onClearFilters={handleClearFilters}
        hasActiveFilters={searchTerm.length > 0 || filterStatus.length > 0}
      />

      {isAdmin && (
        <AddExistingProjectDialog
          isOpen={isAddProjectDialogOpen}
          onClose={() => setIsAddProjectDialogOpen(false)}
          teamId={teamId}
          teamName={teamName}
          onProjectAdded={handleProjectAdded}
        />
      )}

      {/* Empty state jika tidak ada project yang sesuai filter/search */}
      {filteredProjects.length === 0 ? (
        <Card>
          <EmptyState
            // icon={FolderKanban}
            title={
              projects.length === 0 ? "No projects yet" : "No projects found"
            }
            description={
              projects.length === 0
                ? "No projects assigned to this team yet."
                : "No projects found matching your search or filter."
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const completedTasks = project.metrics?.completedTasks || 0;
            const totalTasks = project.metrics?.totalTasks || 0;
            return (
              <div key={project.id} className="relative">
                <ProjectCard project={project} />
                {isAdmin && (
                  <div className="absolute bottom-4 right-4 z-10 mt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:bg-red-100"
                      onClick={() => handleRemoveProject(project)}
                      title="Remove from Team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DeleteProjectDialog
        isOpen={isRemoveDialogOpen}
        onClose={() => setIsRemoveDialogOpen(false)}
        project={projectToRemove}
        onDelete={confirmRemoveProject}
        isLoading={isRemoving}
        teamName={teamName}
      />
    </div>
  );
}
