"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/molecules/dialog";
import { Input } from "@/components/atomics/input";
import { Label } from "@/components/atomics/label";
import { Button } from "@/components/atomics/button";

// Import komponen baru
import { PageHeader } from "@/components/common/layout/PageHeader";
import TeamFilterBar from "@/app/teams/section/TeamFilterBar.section";
import { EmptyState } from "@/components/common/data-display/EmptyState";
import TeamCard from "@/app/teams/section/TeamCard.section";

import {
  getTeams,
  createTeam,
  type Team,
  type UserData,
  type TeamMember,
  getTeamMetrics,
  getUsers,
  getUserData,
} from "@/lib/firestore";
import { Alert, AlertDescription } from "@/components/molecules/Alert.molecule";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/atomics/Avatar.atomic";

export function TeamsContent() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    description: "",
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    members: [] as string[],
    progress: [] as string[],
  });

  // Sort states
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch teams
        const teamsData = await getTeams();

        // Fetch metrics for each team
        const teamsWithMetrics = await Promise.all(
          teamsData.map(async (team) => {
            try {
              const metrics = await getTeamMetrics(team.id);
              return {
                ...team,
                metrics,
              };
            } catch (error) {
              console.error(
                `Error fetching metrics for team ${team.id}:`,
                error
              );
              return team;
            }
          })
        );

        setTeams(teamsWithMetrics);

        // Fetch all users for admin
        if (userRole === "admin") {
          const usersData = await getUsers();
          setAllUsers(usersData);
        }
      } catch (error) {
        console.error("Error fetching teams data:", error);
        setError("Failed to load teams. Please try again later.");
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
    setTeamFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setError(null);

      await createTeam({
        name: teamFormData.name,
        description: teamFormData.description,
        members: [],
        createdBy: user.uid,
      });

      // Refresh teams list
      const teamsData = await getTeams();
      setTeams(teamsData);

      // Reset form
      setTeamFormData({
        name: "",
        description: "",
      });
      setIsTeamDialogOpen(false);
    } catch (error) {
      console.error("Error creating team:", error);
      setError("Failed to create team. Please try again.");
    }
  };

  const navigateToTeamDetail = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  const handleFilterChange = (type: "members" | "progress", value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (value === "") {
        newFilters[type] = [];
      } else if (newFilters[type][0] === value) {
        newFilters[type] = [];
      } else {
        newFilters[type] = [value];
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      members: [],
      progress: [],
    });
    setSearchTerm("");
  };

  // Handler sort (toggle direction jika klik field yang sama)
  const handleSortFieldChange = (field: string) => {
    if (sortField === field) {
      setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  const handleSortDirectionChange = (dir: "asc" | "desc") => {
    setSortDirection(dir);
  };

  // Apply filters and sorting to teams
  const applyFiltersAndSort = () => {
    let filtered = [...teams];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(term) ||
          (team.description && team.description.toLowerCase().includes(term))
      );
    }

    // Apply team size filters
    if (filters.members.length > 0) {
      filtered = filtered.filter((team) => {
        const memberCount = team.members.length;
        if (filters.members.includes("small") && memberCount <= 5) return true;
        if (
          filters.members.includes("medium") &&
          memberCount > 5 &&
          memberCount <= 10
        )
          return true;
        if (filters.members.includes("large") && memberCount > 10) return true;
        return false;
      });
    }

    // Apply progress filters
    if (filters.progress.length > 0) {
      filtered = filtered.filter((team) => {
        const progress = team.metrics?.completionRate || 0;
        if (filters.progress.includes("low") && progress < 30) return true;
        if (
          filters.progress.includes("medium") &&
          progress >= 30 &&
          progress < 70
        )
          return true;
        if (filters.progress.includes("high") && progress >= 70) return true;
        return false;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      if (sortField === "members") {
        return sortDirection === "asc"
          ? a.members.length - b.members.length
          : b.members.length - a.members.length;
      }

      if (sortField === "progress") {
        const progressA = a.metrics?.completionRate || 0;
        const progressB = b.metrics?.completionRate || 0;
        return sortDirection === "asc"
          ? progressA - progressB
          : progressB - progressA;
      }

      return 0;
    });

    return filtered;
  };

  const filteredTeams = applyFiltersAndSort();

  // Adapts Firestore team format to TeamCard format
  const adaptTeamForCard = (team: Team) => {
    return {
      id: team.id,
      name: team.name,
      description: team.description || "No description provided",
      members: team.members.length,
      projects: team.metrics?.activeProjects || 0,
      tasks: team.metrics?.totalTasks || 0,
      completedTasks: team.metrics?.completedTasks || 0,
      progress: team.metrics?.completionRate || 0,
      memberDetails: team.memberDetails || [],
    };
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Teams"
        description={
          userRole === "admin"
            ? "Manage teams and members"
            : "View your teams and colleagues"
        }
        actionLabel={userRole === "admin" ? "Create Team" : undefined}
        onAction={
          userRole === "admin" ? () => setIsTeamDialogOpen(true) : undefined
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <TeamFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortFieldChange={handleSortFieldChange}
        onSortDirectionChange={handleSortDirectionChange}
        onClearFilters={clearFilters}
      />

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

                    <div className="flex justify-between pt-2">
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onClick={() => navigateToTeamDetail(team.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No teams found"
          description={
            searchTerm ||
            filters.members.length > 0 ||
            filters.progress.length > 0
              ? "Try adjusting your filters or search term"
              : userRole === "admin"
                ? "Create a team to get started"
                : "You are not a member of any team yet"
          }
          actionLabel={userRole === "admin" ? "Create Team" : undefined}
        />
      )}

      {/* Create Team Dialog */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateTeam}>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a new team for your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={teamFormData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Team Description</Label>
                <Input
                  id="description"
                  value={teamFormData.description}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" aria-label="Create new team">
                Create Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TeamMemberItemProps {
  member: TeamMember;
  team: Team;
  userRole: string | null;
}

function TeamMemberItem({ member }: TeamMemberItemProps) {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      const data = await getUserData(member.userId);
      setUserData(data);
    }
    fetchUserData();
  }, [member.userId]);

  if (!userData) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage
          src={userData.photoURL || undefined}
          alt={userData.displayName || userData.email}
        />
        <AvatarFallback>
          {(userData.displayName || userData.email || "")
            .substring(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">
          {userData.displayName || userData.email}
        </p>
        <p className="text-xs text-muted-foreground">{member.role}</p>
      </div>
    </div>
  );
}
