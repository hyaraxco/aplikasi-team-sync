"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Users, ChevronRight } from "lucide-react"
import { getTeams, createTeam, getUserData, type Team, type UserData, type TeamMember } from "@/lib/firestore"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function TeamsContent() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [allUsers, setAllUsers] = useState<UserData[]>([])
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch teams
        const teamsData = await getTeams()
        setTeams(teamsData)

        // Fetch all users for admin
        if (userRole === "admin") {
          const usersSnapshot = await getDocs(collection(db, "users"))
          const usersData = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as UserData)
          setAllUsers(usersData)
        }
      } catch (error) {
        console.error("Error fetching teams data:", error)
        setError("Failed to load teams. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, userRole])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setTeamFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      setError(null)

      await createTeam({
        name: teamFormData.name,
        description: teamFormData.description,
        members: [],
        createdBy: user.uid,
      })

      // Refresh teams list
      const teamsData = await getTeams()
      setTeams(teamsData)

      // Reset form
      setTeamFormData({
        name: "",
        description: "",
      })
      setIsTeamDialogOpen(false)
    } catch (error) {
      console.error("Error creating team:", error)
      setError("Failed to create team. Please try again.")
    }
  }

  const navigateToTeamDetail = (teamId: string) => {
    router.push(`/teams/${teamId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            {userRole === "admin" ? "Manage teams and members" : "View your teams and colleagues"}
          </p>
        </div>
        {userRole === "admin" && (
          <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateTeam}>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>Create a new team for your organization.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Team Name</Label>
                    <Input id="name" value={teamFormData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" value={teamFormData.description} onChange={handleInputChange} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Team</Button>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="px-6 py-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <div className="space-y-3">
                      {Array(3)
                        .fill(0)
                        .map((_, j) => (
                          <div key={j} className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16 mt-1" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        ) : teams.length > 0 ? (
          teams.map((team) => (
            <Card
              key={team.id}
              className="overflow-hidden transition-all hover:shadow-md cursor-pointer group"
              onClick={() => navigateToTeamDetail(team.id)}
            >
              <CardHeader className="bg-muted/50">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      {team.name}
                    </CardTitle>
                    <CardDescription className="mt-2">{team.description}</CardDescription>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-6 py-4">
                  <h4 className="text-sm font-medium mb-2">Members ({team.members.length})</h4>
                  <div className="space-y-3">
                    {team.members.slice(0, 3).map((member) => (
                      <TeamMemberItem key={member.userId} member={member} team={team} userRole={userRole} />
                    ))}
                    {team.members.length > 3 && (
                      <div className="text-sm text-muted-foreground pt-1">+{team.members.length - 3} more members</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-6 text-center text-muted-foreground">No teams found</div>
        )}
      </div>
    </div>
  )
}

interface TeamMemberItemProps {
  member: TeamMember
  team: Team
  userRole: string | null
}

function TeamMemberItem({ member, team, userRole }: TeamMemberItemProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true)
        const data = await getUserData(member.userId)
        setUserData(data)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [member.userId])

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
      </div>
    )
  }

  const displayName = userData?.displayName || userData?.email?.split("@")[0] || "Unknown User"
  const initials = displayName.substring(0, 2).toUpperCase()

  return (
    <div className="flex items-center">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={userData?.photoURL || ""} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">{displayName}</p>
          <p className="text-xs text-muted-foreground">{member.role}</p>
        </div>
      </div>
    </div>
  )
}
