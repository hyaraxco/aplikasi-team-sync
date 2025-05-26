import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
  arrayUnion,
} from "firebase/firestore"
import { db, auth } from "./firebase"
import { USER_ROLES } from "./constants"

// User types
export type UserRole = "admin" | "user"

export interface UserData {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  role: UserRole
  status?: string // Add status field
  createdAt: Timestamp
  updatedAt: Timestamp
  hourlyRate?: number
  department?: string
  position?: string
  phoneNumber?: string
  bio?: string
  activeTeams?: string[] // Teams the user is currently active in
  preferredWorkingHours?: { // User's preferred working hours
    start: string // e.g., "09:00"
    end: string   // e.g., "17:00"
    timezone?: string // e.g., "Asia/Jakarta"
  }
}

// Project types
export enum ProjectStatus {
  Planning = "planning",
  InProgress = "in-progress",
  Completed = "completed",
  OnHold = "on-hold"
}
export enum ProjectPriority {
  Low = "low",
  Medium = "medium",
  High = "high"
}

export interface Project {
  id: string
  name: string
  description?: string
  deadline: Timestamp
  status: ProjectStatus
  teams: string[]
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
  priority: ProjectPriority
  taskIds?: string[] // IDs of tasks associated with this project
  metrics?: ProjectMetrics // Metrics for quick project progress overview
}

// Interface for Project Metrics
export interface ProjectMetrics {
  totalTasks: number
  completedTasks: number
  completionRate: number // Percentage (0-100)
  activeMembers?: number // Number of unique active members across associated teams/tasks (optional to implement)
  budgetSpent?: number // Optional: if tracking project budget
  hoursLogged?: number // Optional: if tracking time
}

// Task types
export type TaskStatus = "not-started" | "in-progress" | "completed" | "blocked"

// Interface for Task Comments
export interface TaskComment {
  id: string
  userId: string // User who made the comment
  userName?: string // Denormalized for quick display
  userPhotoURL?: string // Denormalized for quick display
  text: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export interface Task {
  id: string
  name: string
  description?: string
  projectId: string
  assignedTo?: string[] // Changed to array to support multiple assignees or unassigned
  status: TaskStatus
  deadline: Timestamp
  price: number
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
  teamId?: string // ID of the team directly responsible for this task, if any
  comments?: TaskComment[] // Embedded comments for the task
}

// Team types
export interface TeamMember {
  userId: string
  role: string
  joinedAt: Timestamp
  status?: string
}

export interface Team {
  id: string
  name: string
  description?: string
  members: TeamMember[]
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
  metrics?: TeamMetrics
  memberDetails?: UserData[]
  lead?: {
    userId: string
    name: string
    email: string
    phone?: string
    role: string
    photoURL?: string
  }
}

// Attendance types
export interface AttendanceRecord {
  id: string
  userId: string
  date: Timestamp
  checkIn: Timestamp
  checkOut?: Timestamp
  hoursWorked?: number
  hourlyRate: number // Rate at the time of this specific attendance record
  earnings?: number
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  teamId?: string // ID of the team this attendance is related to, if applicable
}

// Payroll types
export type PayrollStatus = "pending" | "processing" | "paid" | "failed"

export interface Payroll {
  id: string
  userId: string
  period: string
  startDate: Timestamp
  endDate: Timestamp
  taskEarnings: number
  attendanceEarnings: number
  totalEarnings: number
  status: PayrollStatus
  processedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  approvedBy?: string // User ID of the person who approved this payroll
}

// Activity types
export type ActivityType = "project" | "task" | "team" | "attendance" | "payroll" | "user"

import { FieldValue } from "firebase/firestore"

// Define standard action types for activities
export enum ActivityActionType {
  // Project Actions
  PROJECT_CREATED = "project_created",
  PROJECT_UPDATED = "project_updated",
  PROJECT_DELETED = "project_deleted",
  // Task Actions
  TASK_CREATED = "task_created",
  TASK_UPDATED = "task_updated",
  TASK_COMPLETED = "task_completed",
  TASK_ASSIGNED = "task_assigned",
  TASK_STATUS_CHANGED = "task_status_changed",
  // Team Actions
  TEAM_CREATED = "team_created",
  TEAM_UPDATED = "team_updated",
  TEAM_DELETED = "team_deleted",
  TEAM_MEMBER_ADDED = "team_member_added",
  TEAM_MEMBER_REMOVED = "team_member_removed",
  TEAM_MEMBER_ROLE_UPDATED = "team_member_role_updated",
  TEAM_MEMBER_STATUS_UPDATED = "team_member_status_updated", // More specific than generic member_updated
  TEAM_MEMBER_DETAILS_UPDATED = "team_member_details_updated", // For general member detail changes
  TEAM_LEAD_CHANGED = "team_lead_changed",
  // Attendance Actions
  ATTENDANCE_CHECK_IN = "attendance_check_in",
  ATTENDANCE_CHECK_OUT = "attendance_check_out",
  ATTENDANCE_RECORD_UPDATED = "attendance_record_updated",
  // Payroll Actions
  PAYROLL_GENERATED = "payroll_generated",
  PAYROLL_STATUS_UPDATED = "payroll_status_updated",
  // User Profile Actions (Example)
  USER_PROFILE_UPDATED = "user_profile_updated",
  // Generic/System
  GENERIC_UPDATE = "generic_update",
  GENERIC_CREATE = "generic_create",
  GENERIC_DELETE = "generic_delete",
}

export interface Activity {
  id: string
  userId: string
  type: ActivityType
  action: ActivityActionType
  targetId?: string
  targetName?: string
  timestamp: Timestamp | FieldValue
  teamId?: string // If the activity is directly related to a specific team's context
  details?: Record<string, any> // For additional structured information about the activity
  status?: "read" | "unread" // For notification purposes
}

// Team metrics interface
export interface TeamMetrics {
  totalMembers: number
  activeProjects: number
  pendingTasks: number
  completedTasks: number
  totalTasks: number
  completionRate: number
}

// User functions
/**
 * Retrieves user data from Firestore by user ID
 * @param userId - The unique identifier of the user
 * @returns A promise that resolves to UserData object or null if not found
 * @throws Logs error but returns null on failure
 */
export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UserData
    }
    return null
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

export async function createUserData(userId: string, userData: Partial<UserData>): Promise<void> {
  try {
    const now = serverTimestamp()
    await setDoc(doc(db, "users", userId), {
      ...userData,
      role: userData.role || "user",
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    console.error("Error creating user data:", error)
    throw error
  }
}

export async function updateUserData(userId: string, userData: Partial<UserData>): Promise<void> {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating user data:", error)
    throw error
  }
}

// Project functions
export async function getProjects(projectId?: string): Promise<Project[]> {
  try {
    let projectsQuery
    if (projectId) {
      projectsQuery = query(collection(db, "projects"), where("id", "==", projectId), orderBy("createdAt", "desc"))
    } else {
      projectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"))
    }

    const projectsSnapshot = await getDocs(projectsQuery)
    return projectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return []
  }
}

export async function createProject(projectData: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const now = serverTimestamp()
    const projectRef = await addDoc(collection(db, "projects"), {
      ...projectData,
      createdAt: now,
      updatedAt: now,
    })

    // Add activity for each team involved
    for (const teamId of projectData.teams) {
      await addActivity({
        userId: projectData.createdBy,
        type: "project",
        action: ActivityActionType.PROJECT_CREATED,
        targetId: projectRef.id,
        targetName: projectData.name,
        timestamp: now,
        teamId: teamId,
        details: { teams: projectData.teams }
      })
    }

    return projectRef.id
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}

// Task functions
export async function getTasks(userId?: string, projectId?: string): Promise<Task[]> {
  try {
    let tasksQuery

    if (projectId) {
      tasksQuery = query(collection(db, "tasks"), where("projectId", "==", projectId), orderBy("createdAt", "desc"))
    } else if (userId) {
      tasksQuery = query(collection(db, "tasks"), where("assignedTo", "==", userId), orderBy("createdAt", "desc"))
    } else {
      tasksQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"))
    }

    const tasksSnapshot = await getDocs(tasksQuery)
    return tasksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Task)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return []
  }
}

export async function createTask(taskData: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const now = serverTimestamp()
    const taskRef = await addDoc(collection(db, "tasks"), {
      ...taskData,
      createdAt: now,
      updatedAt: now,
    })
    return taskRef.id
  } catch (error) {
    console.error("Error creating task:", error)
    throw error
  }
}

export async function completeTask(taskId: string, userId: string): Promise<void> {
  try {
    const taskRef = doc(db, "tasks", taskId)
    const now = serverTimestamp()
    await updateDoc(taskRef, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    })

    // Add activity
    await addActivity({
      userId,
      type: "task",
      action: ActivityActionType.TASK_COMPLETED,
      targetId: taskId,
      timestamp: now,
    })
  } catch (error) {
    console.error("Error completing task:", error)
    throw error
  }
}

// Team functions
export async function getTeams(): Promise<Team[]> {
  try {
    const teamsSnapshot = await getDocs(query(collection(db, "teams"), orderBy("createdAt", "desc")));
    const teamsData = teamsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Team);

    // The calculation of detailed metrics and fetching all member details for all teams
    // is removed from here to improve performance.
    // These details should be fetched on demand for a specific team or populated
    // via background functions.

    // Example of how you might fetch minimal member details (e.g., avatars) if needed for a list view,
    // but this should be done judiciously or per team.
    const teamsWithMinimalDetails: Team[] = await Promise.all(
      teamsData.map(async (team) => {
        let memberAvatars: UserData[] = [];
        if (team.members && team.members.length > 0) {
          // Fetch only a few (e.g., first 3-5) members' UserData for avatars if absolutely necessary for a list.
          // Consider if even this is needed for the general getTeams() call.
          // For full member details, use a specific function like getTeamMembersWithData(teamId).
          const memberIdsToFetch = team.members.slice(0, 3).map(member => member.userId);
          const memberPromises = memberIdsToFetch.map(id => getUserData(id));
          const fetchedMembers = (await Promise.all(memberPromises)).filter(member => member !== null) as UserData[];
          memberAvatars = fetchedMembers;
        }
        return {
          ...team,
          memberDetails: memberAvatars,
        };
      })
    );
    return teamsWithMinimalDetails;
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  try {
    const teamsQuery = query(collection(db, "teams"))
    const teamsSnapshot = await getDocs(teamsQuery)

    // Filter teams where the user is a member
    return teamsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Team)
      .filter((team) => team.members.some((member) => member.userId === userId))
  } catch (error) {
    console.error("Error fetching user teams:", error)
    return []
  }
}

export async function addTeamMember(teamId: string, member: TeamMember): Promise<void> {
  try {
    const teamRef = doc(db, "teams", teamId)
    const teamDoc = await getDoc(teamRef)

    if (!teamDoc.exists()) {
      throw new Error("Team not found")
    }

    const teamData = teamDoc.data() as Team
    const updatedMembers = [...teamData.members, member]

    await updateDoc(teamRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    })

    // Add activity log
    const actor = auth.currentUser;
    const actorData = actor ? await getUserData(actor.uid) : null;
    const actorName = actorData?.displayName || actor?.email || "System";

    const newMemberData = await getUserData(member.userId);
    const newMemberName = newMemberData?.displayName || `User (${member.userId.substring(0,6)})`;

    await addActivity({
      userId: actor?.uid || "system",
      type: "team",
      action: ActivityActionType.TEAM_MEMBER_ADDED,
      targetId: teamId,
      targetName: teamData.name,
      timestamp: serverTimestamp(),
      teamId: teamId,
      details: {
        actorName: actorName,
        addedMemberId: member.userId,
        addedMemberName: newMemberName,
        addedMemberRole: member.role,
      }
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    throw error;
  }
}

// Function to add an existing user to a team
export async function addExistingUserToTeam(
  teamId: string,
  userId: string,
  role: string
): Promise<TeamMember> {
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) {
    throw new Error(`Team with ID ${teamId} not found.`);
  }

  const teamData = teamSnap.data() as Team;
  const isAlreadyMember = teamData.members.some(member => member.userId === userId);

  if (isAlreadyMember) {
    throw new Error(`User ${userId} is already a member of team ${teamId}.`);
  }

  const newTeamMember: TeamMember = {
    userId,
    role,
    joinedAt: Timestamp.now(),
    status: "Active",
  };

  try {
    await updateDoc(teamRef, {
      members: arrayUnion(newTeamMember),
    });
    // Optionally, update team metrics (e.g., totalMembers) if denormalized.
    // await updateDoc(teamRef, { 'metrics.totalMembers': increment(1) });
    // (Requires importing 'increment' from 'firebase/firestore')
    console.log(`User ${userId} added to team ${teamId} as ${role}`);
    return newTeamMember;
  } catch (error) {
    console.error(`Error adding user ${userId} to team ${teamId}:`, error);
    throw new Error("Failed to add user to the team.");
  }
}

// Function to remove a member from a team
export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  try {
    const teamRef = doc(db, "teams", teamId)
    const teamDoc = await getDoc(teamRef)

    if (!teamDoc.exists()) {
      throw new Error("Team not found")
    }

    const teamData = teamDoc.data() as Team
    const updatedMembers = teamData.members.filter((member) => member.userId !== userId)

    await updateDoc(teamRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    })

    // Add activity
    await addActivity({
      userId,
      type: "team",
      action: ActivityActionType.TEAM_MEMBER_REMOVED,
      targetId: teamId,
      targetName: teamData.name,
      timestamp: serverTimestamp(),
      teamId: teamId,
    })
  } catch (error) {
    console.error("Error removing team member:", error)
    throw error
  }
}

export async function createTeam(teamData: Omit<Team, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const now = serverTimestamp()
    const teamRef = await addDoc(collection(db, "teams"), {
      ...teamData,
      createdAt: now,
      updatedAt: now,
    })

    // Add activity log
    await addActivity({
      userId: teamData.createdBy,
      type: "team",
      action: ActivityActionType.TEAM_CREATED,
      targetId: teamRef.id,
      targetName: teamData.name,
      timestamp: now,
      teamId: teamRef.id,
    })

    return teamRef.id
  } catch (error) {
    console.error("Error creating team:", error)
    throw error
  }
}

// Get a specific team by ID
export async function getTeamById(teamId: string): Promise<Team | null> {
  try {
    const teamDoc = await getDoc(doc(db, "teams", teamId))
    if (teamDoc.exists()) {
      return { id: teamDoc.id, ...teamDoc.data() } as Team
    }
    return null
  } catch (error) {
    console.error("Error fetching team:", error)
    return null
  }
}

// Update a team
export async function updateTeam(teamId: string, teamData: Partial<Team>): Promise<Team> {
  try {
    const teamRef = doc(db, "teams", teamId)
    await updateDoc(teamRef, {
      ...teamData,
      updatedAt: serverTimestamp(),
    })

    // Add activity log
    await addActivity({
      userId: teamData.createdBy || "system",
      type: "team",
      action: ActivityActionType.TEAM_UPDATED,
      targetId: teamId,
      targetName: teamData.name,
      timestamp: serverTimestamp(),
      teamId: teamId,
    })

    // Get the updated team data
    const updatedTeamDoc = await getDoc(teamRef)
    if (!updatedTeamDoc.exists()) {
      throw new Error("Team not found after update")
    }
    return { id: updatedTeamDoc.id, ...updatedTeamDoc.data() } as Team
  } catch (error) {
    console.error("Error updating team:", error)
    throw error
  }
}

// Delete a team
export async function deleteTeam(teamId: string): Promise<void> {
  try {
    // Get team data before deletion for activity log
    const teamRef = doc(db, "teams", teamId)
    const teamDoc = await getDoc(teamRef)

    if (!teamDoc.exists()) {
      throw new Error("Team not found")
    }

    const teamData = teamDoc.data() as Team

    // Delete the team
    await deleteDoc(teamRef)

    // Add activity log
    await addActivity({
      userId: auth.currentUser?.uid || "system",
      type: "team",
      action: ActivityActionType.TEAM_DELETED,
      targetId: teamId,
      targetName: teamData.name,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error deleting team:", error)
    throw new Error("Failed to delete team")
  }
}

// Attendance functions
export async function getAttendanceRecords(
  userId?: string,
): Promise<AttendanceRecord[]> {
  try {
    let attendanceQuery

    if (userId) {
      attendanceQuery = query(collection(db, "attendance"), where("userId", "==", userId), orderBy("date", "desc"))
    } else {
      attendanceQuery = query(collection(db, "attendance"), orderBy("date", "desc"))
    }

    const attendanceSnapshot = await getDocs(attendanceQuery)
    return attendanceSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AttendanceRecord)
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    return []
  }
}

export async function checkIn(userId: string, hourlyRate: number): Promise<string> {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const attendanceRef = await addDoc(collection(db, "attendance"), {
      userId,
      date: Timestamp.fromDate(today),
      checkIn: Timestamp.fromDate(now),
      hourlyRate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Add activity
    await addActivity({
      userId,
      type: "attendance",
      action: ActivityActionType.ATTENDANCE_CHECK_IN,
      targetId: attendanceRef.id,
      timestamp: serverTimestamp(),
    })

    return attendanceRef.id
  } catch (error) {
    console.error("Error checking in:", error)
    throw error
  }
}

export async function checkOut(attendanceId: string, userId: string): Promise<void> {
  try {
    const attendanceRef = doc(db, "attendance", attendanceId)
    const attendanceDoc = await getDoc(attendanceRef)

    if (!attendanceDoc.exists()) {
      throw new Error("Attendance record not found")
    }

    const attendanceData = attendanceDoc.data() as AttendanceRecord
    const now = new Date()
    const checkInTime = attendanceData.checkIn.toDate()

    // Calculate hours worked (in hours)
    const hoursWorked = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

    // Calculate earnings
    const earnings = hoursWorked * attendanceData.hourlyRate

    await updateDoc(attendanceRef, {
      checkOut: Timestamp.fromDate(now),
      hoursWorked,
      earnings,
      updatedAt: serverTimestamp(),
    })

    // Add activity
    await addActivity({
      userId,
      type: "attendance",
      action: ActivityActionType.ATTENDANCE_CHECK_OUT,
      targetId: attendanceId,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error checking out:", error)
    throw error
  }
}

// Activity functions
export async function getRecentActivities(limitCount = 10): Promise<Activity[]> {
  try {
    const activitiesQuery = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(limitCount))

    const activitiesSnapshot = await getDocs(activitiesQuery)
    return activitiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Activity)
  } catch (error) {
    console.error("Error fetching activities:", error)
    return []
  }
}

export async function getUserActivities(userId: string, limitCount = 10): Promise<Activity[]> {
  try {
    const activitiesQuery = query(
      collection(db, "activities"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(limitCount),
    )

    const activitiesSnapshot = await getDocs(activitiesQuery)
    return activitiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Activity)
  } catch (error) {
    console.error("Error fetching user activities:", error)
    return []
  }
}

// Payroll functions
export async function getPayrollRecords(userId?: string): Promise<Payroll[]> {
  try {
    let payrollQuery

    if (userId) {
      payrollQuery = query(collection(db, "payroll"), where("userId", "==", userId), orderBy("createdAt", "desc"))
    } else {
      payrollQuery = query(collection(db, "payroll"), orderBy("createdAt", "desc"))
    }

    const payrollSnapshot = await getDocs(payrollQuery)
    return payrollSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Payroll)
  } catch (error) {
    console.error("Error fetching payroll records:", error)
    return []
  }
}

// Team Detail Page Functions
export async function getTeamProjects(teamId: string): Promise<Project[]> {
  try {
    const projectsQuery = query(
      collection(db, "projects"),
      where("teams", "array-contains", teamId),
      orderBy("createdAt", "desc")
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    const projects = projectsSnapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Project[];

    // Calculate metrics for each project
    const projectsWithMetrics = await Promise.all(
      projects.map(async (project) => {
        const tasks = await getTasks(undefined, project.id);
        const completedTasks = tasks.filter(
          (task) => task.status === "completed"
        ).length;
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;

        return {
          ...project,
          metrics: {
            totalTasks,
            completedTasks,
            completionRate,
          },
        };
      })
    );

    return projectsWithMetrics;
  } catch (error) {
    console.error("Error fetching team projects:", error);
    return [];
  }
}

// Get team-specific tasks
export async function getTeamTasks(teamId: string, projectId?: string): Promise<Task[]> {
  try {
    // First get the team to get member IDs
    const team = await getTeamById(teamId)
    if (!team) {
      throw new Error("Team not found")
    }

    // Get member IDs
    const memberIds = team.members.map((member) => member.userId)

    // Get all tasks
    let allTasks: Task[] = []

    // If projectId is provided, filter by project
    if (projectId) {
      const projectTasksQuery = query(
        collection(db, "tasks"),
        where("projectId", "==", projectId),
        orderBy("createdAt", "desc"),
      )
      const projectTasksSnapshot = await getDocs(projectTasksQuery)
      allTasks = projectTasksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Task)
    } else {
      // Otherwise get all tasks
      // Since we can't query by multiple assignedTo values efficiently,
      // we'll get all tasks and filter in memory
      const tasksQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"))
      const tasksSnapshot = await getDocs(tasksQuery)
      allTasks = tasksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Task)
    }

    // Filter tasks to only include those assigned to team members
    return allTasks.filter((task) => {
      // Pastikan assignedTo adalah array
      const assignedTo = Array.isArray(task.assignedTo) ? task.assignedTo : 
                        (task.assignedTo ? [task.assignedTo] : []); // Konversi string ke array jika bukan array
      
      if (assignedTo.length > 0 && memberIds && memberIds.length > 0) {
        // Check if there is any intersection between assignedTo and memberIds
        return assignedTo.some(assigneeId => memberIds.includes(assigneeId));
      }
      return false; // If task is unassigned or memberIds is empty, it won't match
    });
  } catch (error) {
    console.error("Error fetching team tasks:", error)
    return []
  }
}

// Get team activities
export async function getTeamActivities(teamId: string): Promise<Activity[]> {
  try {
    console.log(`Querying activities for teamId: ${teamId}`)

    // First try to query activities specifically related to this team
    let teamActivitiesQuery = query(
      collection(db, "activities"),
      where("teamId", "==", teamId),
      orderBy("timestamp", "desc"),
      limit(50),
    )

    let teamActivitiesSnapshot = await getDocs(teamActivitiesQuery)
    let activities = teamActivitiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Activity)

    console.log(`Found ${activities.length} activities with exact teamId match`)

    // If no activities found, try to get activities where teamId is in targetId
    // This is a fallback for older activities that might not have teamId field
    if (activities.length === 0) {
      console.log("No activities found with teamId field, trying targetId match")
      teamActivitiesQuery = query(
        collection(db, "activities"),
        where("targetId", "==", teamId),
        where("type", "==", "team"),
        orderBy("timestamp", "desc"),
        limit(50),
      )

      teamActivitiesSnapshot = await getDocs(teamActivitiesQuery)
      activities = teamActivitiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Activity)
      console.log(`Found ${activities.length} activities with targetId match`)
    }

    // Get team data to include in activities that don't have targetName
    if (activities.length > 0) {
      const teamDoc = await getDoc(doc(db, "teams", teamId))
      if (teamDoc.exists()) {
        const teamData = teamDoc.data() as Team

        // Add team name to activities that don't have targetName
        activities = activities.map(activity => {
          if (!activity.targetName && activity.type === "team") {
            return { ...activity, targetName: teamData.name }
          }
          return activity
        })
      }
    }

    return activities
  } catch (error) {
    console.error("Error fetching team activities:", error)
    return []
  }
}

// Get team payroll data
export async function getTeamPayroll(teamId: string): Promise<PayrollData[]> {
  try {
    // First get the team to get member IDs
    const team = await getTeamById(teamId)
    if (!team) {
      throw new Error("Team not found")
    }

    // Get member IDs
    const memberIds = team.members.map((member) => member.userId)

    // Get payroll data for each member
    const payrollData: PayrollData[] = []

    for (const memberId of memberIds) {
      // Get user data
      const userData = await getUserData(memberId)
      if (!userData) continue

      // Get tasks completed by this user
      const tasks = await getTasks(memberId)
      const completedTasks = tasks.filter((task) => task.status === "completed")
      const taskEarnings = completedTasks.reduce((sum, task) => sum + task.price, 0)

      // Get attendance records for this user
      const attendanceRecords = await getAttendanceRecords(memberId)
      const attendanceEarnings = attendanceRecords.reduce((sum, record) => sum + (record.earnings || 0), 0)

      // Calculate base salary (simplified)
      const baseSalary = userData.hourlyRate ? userData.hourlyRate * 160 : 0 // Assuming 160 hours per month

      payrollData.push({
        id: memberId,
        userId: memberId,
        teamId: teamId,
        totalEarnings: baseSalary + taskEarnings + attendanceEarnings,
        taskCompletionBonus: taskEarnings,
        attendanceBonus: attendanceEarnings,
        baseSalary: baseSalary,
        tasksCompleted: completedTasks.length,
        attendanceDays: attendanceRecords.length,
      })
    }

    return payrollData
  } catch (error) {
    console.error("Error fetching team payroll data:", error)
    return []
  }
}

// Get team members with user data
export async function getTeamMembersWithData(
  teamId: string,
): Promise<Array<TeamMember & { userData: UserData | null }>> {
  try {
    const team = await getTeamById(teamId)
    if (!team) {
      throw new Error("Team not found")
    }

    const membersWithData = await Promise.all(
      team.members.map(async (member) => {
        const userData = await getUserData(member.userId)
        return {
          ...member,
          userData,
        }
      }),
    )

    return membersWithData
  } catch (error) {
    console.error("Error fetching team members with data:", error)
    return []
  }
}

// Update specific details for a team member
export async function updateTeamMemberDetails(
  teamId: string,
  userId: string,
  memberUpdates: Partial<Omit<TeamMember, 'userId' | 'joinedAt'>> // Allow updating role, phone, department, status
): Promise<void> {
  try {
    const teamRef = doc(db, "teams", teamId);
    const teamDoc = await getDoc(teamRef);

    if (!teamDoc.exists()) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    const teamData = teamDoc.data() as Team;
    const memberIndex = teamData.members.findIndex(m => m.userId === userId);

    if (memberIndex === -1) {
      throw new Error(`Member with userId ${userId} not found in team ${teamId}`);
    }

    const updatedMembers = [...teamData.members];
    // Merge existing member data with updates
    updatedMembers[memberIndex] = {
      ...updatedMembers[memberIndex],
      ...memberUpdates,
    };

    // Cek jika member yang diupdate adalah leader
    let updateData: any = {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    };
    if (teamData.lead && teamData.lead.userId === userId && memberUpdates.role) {
      updateData = {
        ...updateData,
        lead: {
          ...teamData.lead,
          role: memberUpdates.role,
        },
      };
    }

    await updateDoc(teamRef, updateData);

    // Optional: Add activity log for member update
    const actor = auth.currentUser;
    const actorData = actor ? await getUserData(actor.uid) : null;
    const actorName = actorData?.displayName || actor?.email || "System";

    const updatedMemberData = await getUserData(userId);
    const updatedMemberName = updatedMemberData?.displayName || `user (${userId.substring(0,6)})`;

    await addActivity({
      userId: actor?.uid || "system", // Actor ID
      type: "team", // Could also be "user" if focusing on the user being modified within a team context
      action: ActivityActionType.TEAM_MEMBER_DETAILS_UPDATED, // Using the new specific action type
      targetId: userId, // ID of the member whose details were updated
      targetName: updatedMemberName, // Name of the member
      timestamp: serverTimestamp(),
      teamId: teamId,
      details: {
        actorName: actorName,
        updatedMemberId: userId, // Redundant with targetId but explicit
        updatedMemberName: updatedMemberName, // Redundant with targetName but explicit
        updatedFields: Object.keys(memberUpdates), // List of fields that were updated
        teamName: teamData.name // Adding teamName for context
      }
    });

  } catch (error) {
    console.error("Error updating team member details:", error);
    throw error;
  }
}

// Get team metrics
export async function getTeamMetrics(teamId: string): Promise<TeamMetrics> {
  try {
    // Get the team
    const team = await getTeamById(teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Get team's active projects
    const projects = await getTeamProjects(teamId);
    const activeProjects = projects.filter(
      (project) => project.status === ProjectStatus.InProgress
    );

    // Calculate aggregate metrics from all active projects
    let totalProjectTasks = 0;
    let totalCompletedTasks = 0;

    // Get tasks for each active project
    for (const project of activeProjects) {
      const projectTasks = await getTeamTasks(teamId, project.id);
      totalProjectTasks += projectTasks.length;
      totalCompletedTasks += projectTasks.filter(
        (task) => task.status === "completed"
      ).length;
    }

    // Calculate completion rate
    const completionRate = totalProjectTasks > 0
      ? Math.round((totalCompletedTasks / totalProjectTasks) * 100)
      : 0;

    return {
      totalMembers: team.members.length,
      activeProjects: activeProjects.length,
      pendingTasks: totalProjectTasks - totalCompletedTasks,
      completedTasks: totalCompletedTasks,
      totalTasks: totalProjectTasks,
      completionRate,
    };
  } catch (error) {
    console.error("Error calculating team metrics:", error);
    return {
      totalMembers: 0,
      activeProjects: 0,
      pendingTasks: 0,
      completedTasks: 0,
      totalTasks: 0,
      completionRate: 0,
    };
  }
}

// Add activity log
export async function addActivity(activity: Omit<Activity, "id" | "timestamp"> & { timestamp?: Timestamp | FieldValue }): Promise<void> {
  try {
    const activitiesRef = collection(db, "activities")
    await addDoc(activitiesRef, {
      ...activity,
      timestamp: activity.timestamp || serverTimestamp(),
    })
  } catch (error) {
    console.error("Error adding activity:", error)
    // Don't throw here to prevent activity logging from breaking main functionality
  }
}

export interface PayrollData {
  id: string
  userId: string
  teamId: string
  totalEarnings: number
  taskCompletionBonus: number
  attendanceBonus: number
  baseSalary: number
  tasksCompleted: number
  attendanceDays: number
}

// Get user data by email
export async function getUserByEmail(email: string): Promise<UserData | null> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No user found with email: ${email}`);
      return null;
    }
    // Assuming email is unique, return the first match
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as UserData;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

export async function getUsers(): Promise<UserData[]> {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"))
    return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as UserData)
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export { Timestamp }

// Get available users for team member selection (excluding admins and existing members)
export async function getAvailableUsersForTeam(teamId: string): Promise<UserData[]> {
  try {
    // Get current team members to exclude them
    const team = await getTeamById(teamId);
    const currentMemberIds = team ? team.members.map(m => m.userId) : [];

    // Get all regular users (non-admin) who are not yet team members
    const usersQuery = query(
      collection(db, "users"),
      where("role", "==", USER_ROLES.USER) // Explicitly use USER_ROLES.USER constant
    );

    const usersSnapshot = await getDocs(usersQuery);
    const availableUsers = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as UserData)
      .filter(user => {
        // Additional validation checks
        const isNotCurrentMember = !currentMemberIds.includes(user.id);
        const isRegularUser = user.role === USER_ROLES.USER;
        const isActiveUser = user.status !== "inactive"; // Optional: only show active users

        return isNotCurrentMember && isRegularUser && isActiveUser;
      });

    // Sort users by name for better UX
    return availableUsers.sort((a, b) => 
      (a.displayName || a.email || "").localeCompare(b.displayName || b.email || "")
    );
  } catch (error) {
    console.error("Error fetching available users:", error);
    throw new Error("Failed to fetch available users for team");
  }
}

// Function to add an existing project to a team
export async function addExistingProjectToTeam(
  teamId: string,
  projectId: string
): Promise<Project> {
  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    throw new Error(`Project with ID ${projectId} tidak ditemukan.`);
  }

  const projectData = projectSnap.data() as Project;
  const isAlreadyInTeam = projectData.teams.includes(teamId);

  if (isAlreadyInTeam) {
    throw new Error(`Project sudah ada di tim ini.`);
  }

  try {
    await updateDoc(projectRef, {
      teams: arrayUnion(teamId),
      updatedAt: serverTimestamp(),
    });

    // Log aktivitas
    const actor = auth.currentUser;
    const actorId = actor?.uid || "system";
    const actorData = actor ? await getUserData(actor.uid) : null;
    const actorName = actorData?.displayName || actor?.email || "System";

    await addActivity({
      userId: actorId,
      type: "project",
      action: ActivityActionType.PROJECT_UPDATED,
      targetId: projectId,
      targetName: projectData.name,
      timestamp: serverTimestamp(),
      teamId: teamId,
      details: {
        actorName: actorName,
        addedTeamId: teamId,
        projectName: projectData.name,
      },
    });

    // Ambil data project terbaru
    const updatedSnap = await getDoc(projectRef);
    return { id: updatedSnap.id, ...updatedSnap.data() } as Project;
  } catch (error) {
    console.error(`Gagal menambahkan project ke tim:`, error);
    throw new Error("Gagal menambahkan project ke tim.");
  }
}

export async function setTeamLeader(teamId: string, member: TeamMember, userData: UserData) {
  const teamRef = doc(db, "teams", teamId);
  await updateDoc(teamRef, {
    lead: {
      userId: member.userId,
      name: userData.displayName || userData.email || "",
      email: userData.email || "",
      phone: userData.phoneNumber || "",
      role: member.role,
      photoURL: userData.photoURL || "",
    },
    updatedAt: serverTimestamp(),
  });
}

export async function removeTeamFromProject(projectId: string, teamId: string): Promise<void> {
  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);
  if (!projectSnap.exists()) {
    throw new Error(`Project dengan ID ${projectId} tidak ditemukan.`);
  }
  const projectData = projectSnap.data() as Project;
  const updatedTeams = projectData.teams.filter((id: string) => id !== teamId);
  await updateDoc(projectRef, {
    teams: updatedTeams,
    updatedAt: serverTimestamp(),
  });
  // Log aktivitas
  const actor = auth.currentUser;
  const actorId = actor?.uid || "system";
  const actorData = actor ? await getUserData(actor.uid) : null;
  const actorName = actorData?.displayName || actor?.email || "System";
  await addActivity({
    userId: actorId,
    type: "project",
    action: ActivityActionType.PROJECT_UPDATED,
    targetId: projectId,
    targetName: projectData.name,
    timestamp: serverTimestamp(),
    teamId: teamId,
    details: {
      actorName: actorName,
      removedTeamId: teamId,
      projectName: projectData.name,
    },
  });
}
