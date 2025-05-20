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
} from "firebase/firestore"
import { db, auth } from "./firebase"

// User types
export type UserRole = "admin" | "user"

export interface UserData {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  role: UserRole
  createdAt: Timestamp
  updatedAt: Timestamp
  hourlyRate?: number
  department?: string
  position?: string
  phoneNumber?: string
  bio?: string
}

// Project types
export type ProjectStatus = "planning" | "in-progress" | "completed" | "on-hold"

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
}

// Task types
export type TaskStatus = "not-started" | "in-progress" | "completed" | "blocked"

export interface Task {
  id: string
  name: string
  description?: string
  projectId: string
  assignedTo: string
  status: TaskStatus
  deadline: Timestamp
  price: number
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
}

// Team types
export interface TeamMember {
  userId: string
  role: string
  joinedAt: Timestamp
}

export interface Team {
  id: string
  name: string
  description?: string
  members: TeamMember[]
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Attendance types
export interface AttendanceRecord {
  id: string
  userId: string
  date: Timestamp
  checkIn: Timestamp
  checkOut?: Timestamp
  hoursWorked?: number
  hourlyRate: number
  earnings?: number
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
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
}

// Activity types
export type ActivityType = "project" | "task" | "team" | "attendance" | "payroll"

export interface Activity {
  id: string
  userId: string
  type: ActivityType
  action: string
  targetId?: string
  targetName?: string
  timestamp: Timestamp
  teamId?: string
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
export async function getProjects(userId?: string): Promise<Project[]> {
  try {
    let projectsQuery
    if (userId) {
      // Get projects where the user is a member of one of the assigned teams
      // This is a simplified approach - in a real app, you'd need a more complex query
      // or a different data structure to efficiently query projects by team member
      projectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"))
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
        action: "created",
        targetId: projectRef.id,
        targetName: projectData.name,
        timestamp: now,
        teamId: teamId,
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
    await addDoc(collection(db, "activities"), {
      userId,
      type: "task",
      action: "completed",
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
    const teamsQuery = query(collection(db, "teams"), orderBy("createdAt", "desc"))
    const teamsSnapshot = await getDocs(teamsQuery)
    return teamsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Team)
  } catch (error) {
    console.error("Error fetching teams:", error)
    return []
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

    // Add activity
    await addActivity({
      userId: member.userId,
      type: "team",
      action: "joined",
      targetId: teamId,
      targetName: teamData.name,
      timestamp: serverTimestamp(),
      teamId: teamId,
    })
  } catch (error) {
    console.error("Error adding team member:", error)
    throw error
  }
}

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
      action: "left",
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
      action: "created",
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
      action: "updated",
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
      action: "deleted",
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
  startDate?: Date,
  endDate?: Date,
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
      action: "checked in",
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
      action: "checked out",
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
      orderBy("createdAt", "desc"),
    )
    const projectsSnapshot = await getDocs(projectsQuery)
    return projectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project)
  } catch (error) {
    console.error("Error fetching team projects:", error)
    return []
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
    return allTasks.filter((task) => memberIds.includes(task.assignedTo))
  } catch (error) {
    console.error("Error fetching team tasks:", error)
    return []
  }
}

// Get team activities
export async function getTeamActivities(teamId: string): Promise<Activity[]> {
  try {
    // Query activities specifically related to this team
    const teamActivitiesQuery = query(
      collection(db, "activities"),
      where("teamId", "==", teamId),
      orderBy("timestamp", "desc"),
      limit(50),
    )

    const teamActivitiesSnapshot = await getDocs(teamActivitiesQuery)
    return teamActivitiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Activity)
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

// Get team metrics
export async function getTeamMetrics(teamId: string): Promise<TeamMetrics> {
  try {
    // Get the team
    const team = await getTeamById(teamId)
    if (!team) {
      throw new Error("Team not found")
    }

    // Get team projects
    const projects = await getTeamProjects(teamId)
    const activeProjects = projects.filter((project) => project.status === "in-progress").length

    // Get team tasks
    const tasks = await getTeamTasks(teamId)
    const pendingTasks = tasks.filter((task) => task.status !== "completed").length
    const completedTasks = tasks.filter((task) => task.status === "completed").length
    const totalTasks = tasks.length

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalMembers: team.members.length,
      activeProjects,
      pendingTasks,
      completedTasks,
      totalTasks,
      completionRate,
    }
  } catch (error) {
    console.error("Error calculating team metrics:", error)
    return {
      totalMembers: 0,
      activeProjects: 0,
      pendingTasks: 0,
      completedTasks: 0,
      totalTasks: 0,
      completionRate: 0,
    }
  }
}

// Add activity log
export async function addActivity(activity: Omit<Activity, "id">): Promise<void> {
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

export async function getUsers(): Promise<UserData[]> {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"))
    return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as UserData)
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}
