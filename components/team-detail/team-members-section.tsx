"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, UserPlus, Trash, Mail, Phone } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getUserData,
  addTeamMember,
  removeTeamMember,
  getUsers,
  getTasks,
  type Team,
  type UserData,
} from "@/lib/firestore"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { Timestamp } from "firebase/firestore"

interface TeamMembersSectionProps {
  team: Team
  isAdmin: boolean
  onTeamUpdated?: (team: Team) => void
}

export function TeamMembersSection({ team, isAdmin, onTeamUpdated }: TeamMembersSectionProps) {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Array<{ userData: UserData | null; role: string; taskCount: number }>>([])
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [memberRole, setMemberRole] = useState("")
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [actionInProgress, setActionInProgress] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMembersData() {
      try {
        setLoading(true)
        setError(null)

        // Ensure team.members exists and is an array
        const teamMembers = team.members || []

        // Fetch user data for each team member
        const membersPromises = teamMembers.map(async (member) => {
          const userData = await getUserData(member.userId)

          // Get tasks assigned to this user
          const userTasks = await getTasks(member.userId)
          const taskCount = userTasks.filter((task) => task.status !== "completed").length

          return {
            userData,
            role: member.role || "Member",
            taskCount,
          }
        })

        const membersData = await Promise.all(membersPromises)
        setMembers(membersData)

        // If admin, fetch available users to add
        if (isAdmin) {
          const allUsers = await getUsers()
          const teamMemberIds = new Set(teamMembers.map((m) => m.userId))
          const availableUsers = allUsers.filter((user) => !teamMemberIds.has(user.id))
          setAvailableUsers(availableUsers)
        }
      } catch (error) {
        console.error("Error fetching team members data:", error)
        setError("Failed to load team members. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchMembersData()
  }, [team, isAdmin])

  const handleAddMember = async () => {
    if (!selectedUserId || !memberRole) {
      setError("Please select a user and specify their role")
      return
    }

    try {
      setActionInProgress(true)
      setError(null)

      await addTeamMember(team.id, {
        userId: selectedUserId,
        role: memberRole,
        joinedAt: Timestamp.now(),
      })

      // Update the team object with the new member
      const updatedTeam = {
        ...team,
        members: [
          ...(team.members || []),
          {
            userId: selectedUserId,
            role: memberRole,
            joinedAt: Timestamp.now(),
          },
        ],
      }

      // Close dialog and reset form
      setIsAddMemberDialogOpen(false)
      setSelectedUserId("")
      setMemberRole("")

      // Update the parent component if callback provided
      if (onTeamUpdated) {
        onTeamUpdated(updatedTeam)
      } else {
        // Refresh the page to show updated members
        window.location.reload()
      }
    } catch (error) {
      console.error("Error adding team member:", error)
      setError("Failed to add team member. Please try again.")
    } finally {
      setActionInProgress(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    try {
      setActionInProgress(true)
      setError(null)

      await removeTeamMember(team.id, memberToRemove)

      // Update the team object without the removed member
      const updatedTeam = {
        ...team,
        members: (team.members || []).filter((member) => member.userId !== memberToRemove),
      }

      // Close dialog
      setIsDeleteDialogOpen(false)
      setMemberToRemove(null)

      // Update the parent component if callback provided
      if (onTeamUpdated) {
        onTeamUpdated(updatedTeam)
      } else {
        // Refresh the page to show updated members
        window.location.reload()
      }
    } catch (error) {
      console.error("Error removing team member:", error)
      setError("Failed to remove team member. Please try again.")
    } finally {
      setActionInProgress(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {team.members?.length || 0} {(team.members?.length || 0) === 1 ? "member" : "members"} in this team
          </CardDescription>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddMemberDialogOpen(true)} disabled={actionInProgress}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 text-sm border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length > 0 ? (
          <div className="space-y-4">
            {members.map((member, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.userData?.photoURL || ""} alt={member.userData?.displayName || ""} />
                    <AvatarFallback>
                      {member.userData?.displayName
                        ? member.userData.displayName.substring(0, 2).toUpperCase()
                        : member.userData?.email
                          ? member.userData.email.substring(0, 2).toUpperCase()
                          : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {member.userData?.displayName || member.userData?.email?.split("@")[0] || "Unknown User"}
                    </h4>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                      {member.userData?.email && (
                        <a
                          href={`mailto:${member.userData.email}`}
                          className="text-xs text-muted-foreground flex items-center hover:text-primary"
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          {member.userData.email}
                        </a>
                      )}
                      {member.userData?.phoneNumber && (
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {member.userData.phoneNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="flex flex-col items-end">
                    <Badge variant={member.taskCount > 0 ? "default" : "outline"}>
                      {member.taskCount} {member.taskCount === 1 ? "task" : "tasks"}
                    </Badge>
                    <span className="text-xs text-muted-foreground mt-1">
                      {member.userData?.department || "No department"}
                    </span>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setMemberToRemove(member.userData?.id || null)
                        setIsDeleteDialogOpen(true)
                      }}
                      disabled={actionInProgress}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Remove member</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No members in this team yet.</p>
            {isAdmin && (
              <Button variant="outline" className="mt-4" onClick={() => setIsAddMemberDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Member
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add a new member to the {team.name} team.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="user">User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length > 0 ? (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.displayName || user.email}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-users" disabled>
                      No available users
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role in Team</Label>
              <Input
                id="role"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                placeholder="e.g. Developer, Designer, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)} disabled={actionInProgress}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedUserId || !memberRole || actionInProgress}>
              {actionInProgress ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        description="Are you sure you want to remove this member from the team? They will no longer have access to team resources."
      />
    </Card>
  )
}
