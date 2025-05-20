"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Edit, Trash2, ChevronLeft, Users, Calendar, CheckSquare, Activity } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { TeamMembersSection } from "@/components/team-detail/team-members-section"
import { TeamProjectsSection } from "@/components/team-detail/team-projects-section"
import { TeamTasksSection } from "@/components/team-detail/team-tasks-section"
import { TeamActivitySection } from "@/components/team-detail/team-activity-section"
import { EditTeamDialog } from "@/components/team-detail/edit-team-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { getTeamById, getTeamProjects, getTeamTasks, deleteTeam, type Team } from "@/lib/firestore"

interface TeamDetailContentProps {
  teamId: string
}

export function TeamDetailContent({ teamId }: TeamDetailContentProps) {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeProjects, setActiveProjects] = useState(0)
  const [pendingTasks, setPendingTasks] = useState(0)
  const [completionRate, setCompletionRate] = useState(0)
  const [activeTab, setActiveTab] = useState("members")

  useEffect(() => {
    async function fetchTeamData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch team data
        const teamData = await getTeamById(teamId)
        if (!teamData) {
          setError("Team not found")
          return
        }
        setTeam(teamData)

        // Fetch team-specific metrics
        const projects = await getTeamProjects(teamId)

        // Count projects with status "in-progress" or "active" (case insensitive)
        const activeProjectsCount = projects.filter((p) => {
          const status = (p.status || "").toLowerCase()
          return status === "in-progress" || status === "active"
        }).length

        setActiveProjects(activeProjectsCount)

        // Fetch team tasks
        const tasks = await getTeamTasks(teamId)
        const pendingTasksCount = tasks.filter((t) => !t.completedAt).length
        setPendingTasks(pendingTasksCount)

        // Calculate completion rate
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t) => t.completedAt).length
        const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        setCompletionRate(rate)
      } catch (error) {
        console.error("Error fetching team data:", error)
        setError("Failed to load team data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [teamId])

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam(teamId)
      router.push("/teams")
    } catch (error) {
      console.error("Error deleting team:", error)
      setError("Failed to delete team. Please try again later.")
    }
  }

  const handleAddMember = () => {
    setEditDialogOpen(true)
  }

  const handleRemoveMember = (memberId: string) => {
    if (!team) return

    // Open edit dialog with the member to remove
    setEditDialogOpen(true)
  }

  const handleTeamUpdated = (updatedTeam: Team) => {
    setTeam(updatedTeam)
  }

  const navigateBack = () => {
    router.push("/teams")
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
          </div>

          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : team ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={navigateBack}
                aria-label="Back to teams"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center">
                  <Users className="mr-2 h-8 w-8" />
                  {team.name}
                </h1>
                <p className="text-muted-foreground mt-1">{team.description || "No description provided"}</p>
              </div>
            </div>
            {userRole === "admin" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Team
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Team
                </Button>
              </div>
            )}
          </div>

          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{team.members?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {team.members?.length === 1 ? "Person" : "People"} in this team
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {activeProjects === 1 ? "Project" : "Projects"} in progress
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTasks}</div>
                <p className="text-xs text-muted-foreground">{pendingTasks === 1 ? "Task" : "Tasks"} to be completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate}%</div>
                <div className="mt-1 h-2 w-full bg-secondary overflow-hidden rounded-full">
                  <div className="h-full bg-primary" style={{ width: `${completionRate}%` }}></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-4 lg:w-auto">
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Members</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="space-y-4">
              <TeamMembersSection team={team} isAdmin={userRole === "admin"} onTeamUpdated={handleTeamUpdated} />
            </TabsContent>
            <TabsContent value="projects" className="space-y-4">
              <TeamProjectsSection teamId={team.id} />
            </TabsContent>
            <TabsContent value="tasks" className="space-y-4">
              <TeamTasksSection teamId={team.id} teamMembers={team.members || []} />
            </TabsContent>
            <TabsContent value="activity" className="space-y-4">
              <TeamActivitySection teamId={team.id} />
            </TabsContent>
          </Tabs>

          {/* Edit Team Dialog */}
          <EditTeamDialog
            team={team}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onTeamUpdated={handleTeamUpdated}
          />

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            title="Delete Team"
            description="Are you sure you want to delete this team? This action cannot be undone and will remove all team data."
            isOpen={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={handleDeleteTeam}
          />
        </>
      ) : null}
    </div>
  )
}
