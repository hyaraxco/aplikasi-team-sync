import type {
  Activity,
  ActivityType,
  AttendanceRecord,
  Earning,
  Milestone,
  Payroll,
  PayrollStatus,
  Project,
  ProjectMetrics,
  ProjectPriority,
  ProjectStatus,
  Task,
  TaskComment,
  TaskPriority,
  TaskStatus,
  Team,
  TeamMember,
  TeamMetrics,
  UserData,
  UserRole,
} from '@/types/database'
import { ActivityActionType } from '@/types/database'
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  FieldValue,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

// Re-export types for backward compatibility
export type {
  Activity,
  ActivityType,
  AttendanceRecord,
  Earning,
  Milestone,
  Payroll,
  PayrollStatus,
  Project,
  ProjectMetrics,
  ProjectPriority,
  ProjectStatus,
  Task,
  TaskComment,
  TaskPriority,
  TaskStatus,
  Team,
  TeamMember,
  TeamMetrics,
  UserData,
  UserRole,
}

// All types are now imported from @/types/database

// All type definitions have been moved to @/types/database

// User functions
/**
 * Retrieves user data from Firestore by user ID
 * @param userId - The unique identifier of the user
 * @returns A promise that resolves to UserData object or null if not found
 * @throws Logs error but returns null on failure
 */
export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UserData
    }
    return null
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}

export async function createUserData(userId: string, userData: Partial<UserData>): Promise<void> {
  try {
    const now = serverTimestamp()
    const finalUserData = {
      ...userData,
      role: userData.role || 'employee',
      status: userData.status || 'pending', // Default status "pending" jika tidak disediakan
      createdAt: now,
      updatedAt: now,
    }

    await setDoc(doc(db, 'users', userId), finalUserData)

    // Jika user baru dibuat dengan status "pending", buat notifikasi untuk admin
    if (finalUserData.status === 'pending') {
      // Ambil semua admin untuk dikirimi notifikasi (atau kirim ke topic/role admin)
      // Untuk contoh ini, kita buat activity umum yang bisa dilihat admin di halaman notifikasi mereka
      // (dengan asumsi query notifikasi admin mengambil semua yang relevan)
      await addActivity({
        // userId dari admin target, atau null/kosong jika notif sistem untuk semua admin.
        // Untuk sekarang, kita set userId ke user yang baru dibuat, tapi type/action menandakan ini untuk admin.
        // Admin akan melihat notif ini karena query notif admin (di NotificationContent) tidak filter userId.
        userId: 'system', // Atau bisa juga user yang melakukan aksi (jika ada, misal admin yg create manual)
        type: 'user',
        action: ActivityActionType.USER_REGISTERED_PENDING_APPROVAL, // Perlu ditambahkan ke enum ActivityActionType
        targetId: userId,
        targetName: finalUserData.displayName || finalUserData.email || 'Unknown User', // Nama user baru
        timestamp: now,
        status: 'unread', // Notifikasi ini belum dibaca
        details: {
          message: `New user ${finalUserData.displayName || finalUserData.email} registered and is awaiting approval.`,
          newUserId: userId,
          newUserEmail: finalUserData.email,
        },
      })
    }
  } catch (error) {
    console.error('Error creating user data:', error)
    throw error
  }
}

export async function updateUserData(userId: string, userData: Partial<UserData>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating user data:', error)
    throw error
  }
}

// Project functions
/**
 * Get projects list based on role and userId.
 * Admin: all projects. User: only projects where their teams are involved.
 */
export async function getProjects(userId?: string, role?: UserRole): Promise<Project[]> {
  try {
    let projectsQuery
    if (role === 'admin') {
      projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
    } else if (userId) {
      // Asumsi: field 'teams' berisi array id tim yang diikuti user
      // Ambil semua tim user, lalu filter project yang timnya diikuti user
      // Atau jika ada field 'members' array-contains userId, bisa langsung pakai itu
      projectsQuery = query(
        collection(db, 'projects'),
        where('members', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      )
    } else {
      return []
    }
    const projectsSnapshot = await getDocs(projectsQuery)
    return projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Project)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

export async function createProject(
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = serverTimestamp()
    const projectRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      createdAt: now,
      updatedAt: now,
    })

    // Add activity for each team involved
    for (const teamId of projectData.teams) {
      await addActivity({
        userId: projectData.createdBy,
        type: 'project',
        action: ActivityActionType.PROJECT_CREATED,
        targetId: projectRef.id,
        targetName: projectData.name,
        timestamp: now,
        teamId: teamId,
        details: { teams: projectData.teams },
      })
    }

    return projectRef.id
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}

// Task functions
/**
 * Get tasks list based on role and userId.
 * Admin: all tasks. User: only tasks assigned to that user.
 */
export async function getTasks(
  userId?: string,
  projectId?: string,
  role?: UserRole
): Promise<Task[]> {
  try {
    let tasksQuery
    if (role === 'admin') {
      if (projectId) {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('projectId', '==', projectId),
          orderBy('createdAt', 'desc')
        )
      } else {
        tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
      }
    } else if (userId) {
      if (projectId) {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('projectId', '==', projectId),
          where('assignedTo', 'array-contains', userId),
          orderBy('createdAt', 'desc')
        )
      } else {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('assignedTo', 'array-contains', userId),
          orderBy('createdAt', 'desc')
        )
      }
    } else {
      return []
    }
    const tasksSnapshot = await getDocs(tasksQuery)
    return tasksSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }) as Task)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
}

export async function createTask(
  taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = serverTimestamp()
    const taskRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      createdAt: now,
      updatedAt: now,
    })
    return taskRef.id
  } catch (error) {
    console.error('Error creating task:', error)
    throw error
  }
}

export async function updateTask(taskId: string, taskData: Partial<Task>): Promise<void> {
  try {
    const taskRef = doc(db, 'tasks', taskId)
    await updateDoc(taskRef, {
      ...taskData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating task:', error)
    throw error
  }
}

/**
 * Employee submits a task for review by an admin.
 * Updates task status to "completed".
 * @param taskId The ID of the task.
 * @param employeeId The ID of the employee submitting the task.
 */
export async function submitTaskForReview(taskId: string, employeeId: string): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId)
  const taskSnap = await getDoc(taskRef)
  if (!taskSnap.exists()) {
    throw new Error('Task not found')
  }
  const taskData = taskSnap.data() as Task

  await updateDoc(taskRef, {
    status: 'completed', // Status indicating ready for admin review
    updatedAt: serverTimestamp(),
    completedAt: serverTimestamp(), // Record completion time by employee
  })

  await addActivity({
    userId: employeeId, // Employee who performed the action
    type: 'task',
    action: ActivityActionType.TASK_SUBMITTED_FOR_REVIEW,
    targetId: taskId,
    targetName: taskData.name,
    details: { projectId: taskData.projectId, submittedBy: employeeId },
  })
}

/**
 * Admin approves a task.
 * Updates task status to "done" and creates an earning if applicable.
 * @param taskId The ID of the task.
 * @param adminId The ID of the admin approving the task.
 */
export async function approveTask(taskId: string, adminId: string): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId)
  const taskSnap = await getDoc(taskRef)

  if (!taskSnap.exists()) {
    throw new Error('Task not found')
  }
  const taskData = taskSnap.data() as Task

  if (taskData.status !== 'completed') {
    // Ensure task was submitted for review
    throw new Error('Task is not awaiting approval or has already been processed.')
  }

  await updateDoc(taskRef, {
    status: 'done', // Final approved state
    updatedAt: serverTimestamp(),
  })

  let earningCreated = false
  if (
    taskData.assignedTo &&
    taskData.assignedTo.length > 0 &&
    taskData.taskRate &&
    taskData.taskRate > 0
  ) {
    for (const assigneeId of taskData.assignedTo) {
      try {
        await createEarning({
          userId: assigneeId,
          type: 'task',
          refId: taskId,
          amount: taskData.taskRate, // Assuming taskRate is per assigned user
        })
        earningCreated = true
      } catch (error) {
        console.error(`Error creating earning for task ${taskId}, user ${assigneeId}:`, error)
        // Continue to next assignee if one fails
      }
    }
  }

  if (earningCreated) {
    await addActivity({
      userId: adminId, // Admin who performed the action
      type: 'task',
      action: ActivityActionType.TASK_APPROVED_WITH_EARNING,
      targetId: taskId,
      targetName: taskData.name,
      details: {
        projectId: taskData.projectId,
        approvedBy: adminId,
        assignedTo: taskData.assignedTo,
        rate: taskData.taskRate,
      },
    })
  } else {
    await addActivity({
      userId: adminId, // Admin who performed the action
      type: 'task',
      action: ActivityActionType.TASK_APPROVED_NO_EARNING,
      targetId: taskId,
      targetName: taskData.name,
      details: {
        projectId: taskData.projectId,
        approvedBy: adminId,
        reason: 'No valid assignee or task rate for earning.',
        assignedTo: taskData.assignedTo,
        rate: taskData.taskRate,
      },
    })
  }
}

/**
 * Employee updates task status for drag and drop operations.
 * Only allows specific status transitions that employees are permitted to make.
 * @param taskId The ID of the task.
 * @param employeeId The ID of the employee updating the task.
 * @param newStatus The new status to set.
 */
export async function updateTaskStatusByEmployee(
  taskId: string,
  employeeId: string,
  newStatus: TaskStatus
): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId)
  const taskSnap = await getDoc(taskRef)

  if (!taskSnap.exists()) {
    throw new Error('Task not found')
  }
  const taskData = taskSnap.data() as Task

  // Verify employee is assigned to this task
  if (!taskData.assignedTo?.includes(employeeId)) {
    throw new Error('You are not assigned to this task')
  }

  // Define allowed status transitions for employees
  const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
    backlog: ['in_progress'],
    in_progress: ['completed'], // This will use submitTaskForReview instead
    completed: [], // No direct transitions allowed
    revision: ['in_progress'], // Allow resuming after revision
    done: [], // No transitions from done
    blocked: ['in_progress'], // Allow unblocking
    rejected: ['in_progress'], // Allow resuming after rejection
  }

  const currentStatus = taskData.status
  if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
    throw new Error(`Cannot change task status from ${currentStatus} to ${newStatus}`)
  }

  await updateDoc(taskRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  })

  // Log activity for status change
  await addActivity({
    userId: employeeId,
    type: 'task',
    action: ActivityActionType.TASK_STATUS_CHANGED,
    targetId: taskId,
    targetName: taskData.name,
    details: {
      message: `Task status changed from ${currentStatus} to ${newStatus}`,
      previousStatus: currentStatus,
      newStatus: newStatus,
    },
  })
}

/**
 * Admin requests revision for a task.
 * Updates task status to "revision" and notifies assigned employee(s).
 * @param taskId The ID of the task.
 * @param adminId The ID of the admin requesting revision.
 * @param revisionNote Optional note for the revision.
 */
export async function requestTaskRevision(
  taskId: string,
  adminId: string,
  revisionNote?: string
): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId)
  const taskSnap = await getDoc(taskRef)

  if (!taskSnap.exists()) {
    throw new Error('Task not found')
  }
  const taskData = taskSnap.data() as Task

  if (taskData.status !== 'completed' && taskData.status !== 'in_progress') {
    // Allow revision request if task is completed (for review) or even in_progress
    console.warn(
      `Requesting revision for task ${taskId} with status ${taskData.status}. Expected "completed" or "in_progress".`
    )
  }

  await updateDoc(taskRef, {
    status: 'revision',
    updatedAt: serverTimestamp(),
  })

  if (taskData.assignedTo && taskData.assignedTo.length > 0) {
    for (const assigneeId of taskData.assignedTo) {
      await addActivity({
        userId: assigneeId, // Activity FOR the employee
        type: 'task',
        action: ActivityActionType.TASK_REVISION_REQUESTED,
        targetId: taskId,
        targetName: taskData.name,
        details: {
          projectId: taskData.projectId,
          requestedBy: adminId,
          note: revisionNote || 'Revision requested by admin.',
        },
      })
    }
  } else {
    // Log activity even if no one is assigned, for admin's record
    await addActivity({
      userId: adminId,
      type: 'task',
      action: ActivityActionType.TASK_REVISION_REQUESTED,
      targetId: taskId,
      targetName: taskData.name,
      details: {
        projectId: taskData.projectId,
        requestedBy: adminId,
        note: revisionNote || 'Revision requested by admin.',
        warning: 'No user was assigned to this task for direct notification.',
      },
    })
  }
}

// Team functions
/**
 * Get teams list based on role and userId.
 * Admin: all teams. User: only teams they are part of.
 */
export async function getTeams(userId?: string, role?: UserRole): Promise<Team[]> {
  try {
    if (role === 'admin') {
      const teamsSnapshot = await getDocs(
        query(collection(db, 'teams'), orderBy('createdAt', 'desc'))
      )
      return teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Team)
    } else if (userId) {
      // Ambil semua tim, filter yang ada userId di members
      const teamsSnapshot = await getDocs(
        query(collection(db, 'teams'), orderBy('createdAt', 'desc'))
      )
      return teamsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as Team)
        .filter(team => {
          // Pastikan team.members adalah array dan member adalah objek yang valid sebelum mengakses userId
          if (Array.isArray(team.members)) {
            return team.members.some(member => member && member.userId === userId)
          }
          return false // Jika team.members bukan array, tim ini tidak akan muncul untuk pengguna non-admin
        })
    } else {
      return []
    }
  } catch (error) {
    console.error('Error fetching teams:', error)
    return []
  }
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  try {
    const teamsQuery = query(collection(db, 'teams'))
    const teamsSnapshot = await getDocs(teamsQuery)

    // Filter teams where the user is a member
    return teamsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as Team)
      .filter(team => team.members.some(member => member.userId === userId))
  } catch (error) {
    console.error('Error fetching user teams:', error)
    return []
  }
}

export async function addTeamMember(teamId: string, member: TeamMember): Promise<void> {
  try {
    const teamRef = doc(db, 'teams', teamId)
    const teamDoc = await getDoc(teamRef)

    if (!teamDoc.exists()) {
      throw new Error('Team not found')
    }

    const teamData = teamDoc.data() as Team
    const updatedMembers = [...teamData.members, member]

    await updateDoc(teamRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    })

    // Add activity log
    const actor = auth.currentUser
    const actorData = actor ? await getUserData(actor.uid) : null
    const actorName = actorData?.displayName || actor?.email || 'System'

    const newMemberData = await getUserData(member.userId)
    const newMemberName = newMemberData?.displayName || `User (${member.userId.substring(0, 6)})`

    await addActivity({
      userId: actor?.uid || 'system',
      type: 'team',
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
      },
    })
  } catch (error) {
    console.error('Error adding team member:', error)
    throw error
  }
}

// Function to add an existing user to a team
export async function addExistingUserToTeam(
  teamId: string,
  userId: string,
  role: string
): Promise<TeamMember> {
  const teamRef = doc(db, 'teams', teamId)
  const teamSnap = await getDoc(teamRef)

  if (!teamSnap.exists()) {
    throw new Error(`Team with ID ${teamId} not found.`)
  }

  const teamData = teamSnap.data() as Team
  const isAlreadyMember = teamData.members.some(member => member.userId === userId)

  if (isAlreadyMember) {
    throw new Error(`User ${userId} is already a member of team ${teamId}.`)
  }

  const newTeamMember: TeamMember = {
    userId,
    role,
    joinedAt: Timestamp.now(),
    status: 'Active',
  }

  try {
    await updateDoc(teamRef, {
      members: arrayUnion(newTeamMember),
    })
    // Optionally, update team metrics (e.g., totalMembers) if denormalized.
    // await updateDoc(teamRef, { 'metrics.totalMembers': increment(1) });
    // (Requires importing 'increment' from 'firebase/firestore')

    return newTeamMember
  } catch (error) {
    console.error(`Error adding user ${userId} to team ${teamId}:`, error)
    throw new Error('Failed to add user to the team.')
  }
}

// Function to remove a member from a team
export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  try {
    const teamRef = doc(db, 'teams', teamId)
    const teamDoc = await getDoc(teamRef)

    if (!teamDoc.exists()) {
      throw new Error('Team not found')
    }

    const teamData = teamDoc.data() as Team
    const updatedMembers = teamData.members.filter(member => member.userId !== userId)

    await updateDoc(teamRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    })

    // Add activity
    await addActivity({
      userId,
      type: 'team',
      action: ActivityActionType.TEAM_MEMBER_REMOVED,
      targetId: teamId,
      targetName: teamData.name,
      timestamp: serverTimestamp(),
      teamId: teamId,
    })
  } catch (error) {
    console.error('Error removing team member:', error)
    throw error
  }
}

export async function createTeam(
  teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = serverTimestamp()
    const teamRef = await addDoc(collection(db, 'teams'), {
      ...teamData,
      createdAt: now,
      updatedAt: now,
    })

    // Add activity log
    await addActivity({
      userId: teamData.createdBy,
      type: 'team',
      action: ActivityActionType.TEAM_CREATED,
      targetId: teamRef.id,
      targetName: teamData.name,
      timestamp: now,
      teamId: teamRef.id,
    })

    return teamRef.id
  } catch (error) {
    console.error('Error creating team:', error)
    throw error
  }
}

// Get a specific team by ID
export async function getTeamById(teamId: string): Promise<Team | null> {
  try {
    const teamDoc = await getDoc(doc(db, 'teams', teamId))
    if (teamDoc.exists()) {
      return { id: teamDoc.id, ...teamDoc.data() } as Team
    }
    return null
  } catch (error) {
    console.error('Error fetching team:', error)
    return null
  }
}

// Update a team
export async function updateTeam(teamId: string, teamData: Partial<Team>): Promise<Team> {
  try {
    const teamRef = doc(db, 'teams', teamId)
    await updateDoc(teamRef, {
      ...teamData,
      updatedAt: serverTimestamp(),
    })

    // Add activity log
    await addActivity({
      userId: teamData.createdBy || 'system',
      type: 'team',
      action: ActivityActionType.TEAM_UPDATED,
      targetId: teamId,
      targetName: teamData.name || 'Unknown Team',
      timestamp: serverTimestamp(),
      teamId: teamId,
    })

    // Get the updated team data
    const updatedTeamDoc = await getDoc(teamRef)
    if (!updatedTeamDoc.exists()) {
      throw new Error('Team not found after update')
    }
    return { id: updatedTeamDoc.id, ...updatedTeamDoc.data() } as Team
  } catch (error) {
    console.error('Error updating team:', error)
    throw error
  }
}

// Delete a team
export async function deleteTeam(teamId: string): Promise<void> {
  try {
    // Get team data before deletion for activity log
    const teamRef = doc(db, 'teams', teamId)
    const teamDoc = await getDoc(teamRef)

    if (!teamDoc.exists()) {
      throw new Error('Team not found')
    }

    const teamData = teamDoc.data() as Team

    // Delete the team
    await deleteDoc(teamRef)

    // Add activity log
    await addActivity({
      userId: auth.currentUser?.uid || 'system',
      type: 'team',
      action: ActivityActionType.TEAM_DELETED,
      targetId: teamId,
      targetName: teamData.name,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error deleting team:', error)
    throw new Error('Failed to delete team')
  }
}

// Attendance functions
/**
 * Get attendance records based on role and userId.
 * Admin: all attendance records. User: only their own attendance records.
 */
export async function getAttendanceRecords(
  userId?: string,
  role?: UserRole
): Promise<AttendanceRecord[]> {
  try {
    let attendanceQuery
    if (role === 'admin') {
      attendanceQuery = query(collection(db, 'attendance'), orderBy('date', 'desc'))
    } else if (userId) {
      attendanceQuery = query(
        collection(db, 'attendance'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      )
    } else {
      return []
    }
    const attendanceSnapshot = await getDocs(attendanceQuery)
    return attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AttendanceRecord)
  } catch (error: any) {
    console.error('Error fetching attendance records:', error)

    // Handle permission errors specifically
    if (error?.code === 'permission-denied') {
      throw new Error(
        'Permission denied accessing attendance records. Please ensure your account has proper permissions.'
      )
    }

    return []
  }
}

export async function checkIn(userId: string): Promise<string> {
  // Check if user has already clocked in today
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))

  const q = query(
    collection(db, 'attendance'),
    where('userId', '==', userId),
    where('checkIn', '>=', Timestamp.fromDate(startOfDay)),
    where('checkIn', '<=', Timestamp.fromDate(endOfDay))
  )

  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    throw new Error('User has already clocked in today.')
  }

  // Proceed to check-in
  const attendanceRef = await addDoc(collection(db, 'attendance'), {
    userId,
    checkIn: serverTimestamp(),
    date: Timestamp.now(), // records the date of checkin
    baseSalary: 0, // Set to 0 or fetch from UserData if still needed for other purposes
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Log activity
  await addActivity({
    userId,
    type: 'attendance',
    action: ActivityActionType.ATTENDANCE_CHECK_IN,
    targetId: attendanceRef.id,
    targetName: `Attendance ${attendanceRef.id}`,
  })

  return attendanceRef.id
}

// NEW function to get today's attendance record for a user
export async function getTodaysAttendance(userId: string): Promise<AttendanceRecord | null> {
  try {
    const today = new Date()
    // Set start of day to 00:00:00.000
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    // Set end of day to 23:59:59.999
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    )

    const q = query(
      collection(db, 'attendance'),
      where('userId', '==', userId),
      where('checkIn', '>=', Timestamp.fromDate(startOfDay)),
      where('checkIn', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('checkIn', 'desc'), // Get the latest if multiple (should not happen with checkIn logic)
      limit(1)
    )

    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]
      if (docSnap) {
        return { id: docSnap.id, ...docSnap.data() } as AttendanceRecord
      }
    }
    return null
  } catch (error: any) {
    console.error("Error fetching today's attendance:", error)

    // Handle permission errors specifically
    if (error?.code === 'permission-denied') {
      throw new Error(
        'Permission denied accessing attendance data. Please ensure your account has proper permissions.'
      )
    }

    throw error
  }
}

export async function checkOut(attendanceId: string, userId: string): Promise<void> {
  const attendanceRef = doc(db, 'attendance', attendanceId)
  const attendanceSnap = await getDoc(attendanceRef)

  if (!attendanceSnap.exists()) {
    throw new Error('Attendance record not found')
  }

  const attendanceData = attendanceSnap.data() as AttendanceRecord

  if (attendanceData.userId !== userId) {
    throw new Error('User not authorized to check out this record')
  }

  if (attendanceData.checkOut) {
    throw new Error('Already checked out for this record')
  }

  const checkOutTime = Timestamp.now()
  const checkInTime = attendanceData.checkIn

  // Calculate hours worked (in milliseconds, then convert to hours)
  const durationMs = checkOutTime.toMillis() - checkInTime.toMillis()
  const hoursWorked = durationMs / (1000 * 60 * 60)

  await updateDoc(attendanceRef, {
    checkOut: checkOutTime,
    hoursWorked: parseFloat(hoursWorked.toFixed(2)), // Store with 2 decimal places
    updatedAt: serverTimestamp(),
  })

  // Log activity
  await addActivity({
    userId,
    type: 'attendance',
    action: ActivityActionType.ATTENDANCE_CHECK_OUT,
    targetId: attendanceId,
    targetName: `Attendance ${attendanceId}`,
    details: { hours: parseFloat(hoursWorked.toFixed(2)) },
  })

  // Create earning if duration is >= 8 hours
  if (hoursWorked >= 8) {
    try {
      await createEarning({
        userId: userId,
        type: 'attendance',
        refId: attendanceId,
        amount: 10000, // Fixed amount as per spec
      })
      // createEarning already logs its own activity (EARNING_CREATED)
    } catch (error) {
      console.error(`Error creating earning for attendance ${attendanceId}:`, error)
      // Potentially add a specific activity log for failed attendance earning creation
    }
  }
}

// Activity functions
export async function getRecentActivities(limitCount = 10): Promise<Activity[]> {
  try {
    const activitiesQuery = query(
      collection(db, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )

    const activitiesSnapshot = await getDocs(activitiesQuery)
    return activitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Activity)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return []
  }
}

export async function getUserActivities(userId: string, limitCount = 10): Promise<Activity[]> {
  try {
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )

    const activitiesSnapshot = await getDocs(activitiesQuery)
    return activitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Activity)
  } catch (error) {
    console.error('Error fetching user activities:', error)
    return []
  }
}

// Payroll functions
/**
 * Mengambil daftar payroll sesuai role dan userId.
 * Admin: semua payroll. User: hanya payroll miliknya.
 */
export async function getPayrollRecords(userId?: string, role?: UserRole): Promise<Payroll[]> {
  try {
    let payrollQuery
    if (role === 'admin') {
      payrollQuery = query(collection(db, 'payroll'), orderBy('createdAt', 'desc'))
    } else if (userId) {
      payrollQuery = query(
        collection(db, 'payroll'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
    } else {
      return []
    }
    const payrollSnapshot = await getDocs(payrollQuery)
    return payrollSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Payroll)
  } catch (error) {
    console.error('Error fetching payroll records:', error)
    return []
  }
}

// Team Detail Page Functions
export async function getTeamProjects(teamId: string): Promise<Project[]> {
  try {
    const projectsQuery = query(
      collection(db, 'projects'),
      where('teams', 'array-contains', teamId),
      orderBy('createdAt', 'desc')
    )
    const projectsSnapshot = await getDocs(projectsQuery)
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[]

    // Calculate metrics for each project
    const projectsWithMetrics = await Promise.all(
      projects.map(async project => {
        const tasks = await getTasks(undefined, project.id)
        const completedTasks = tasks.filter(task => task.status === 'completed').length
        const totalTasks = tasks.length
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        return {
          ...project,
          metrics: {
            totalTasks,
            completedTasks,
            completionRate,
            pendingTasks: totalTasks - completedTasks,
            totalTeams: 0,
            activeMilestones: 0,
          },
        }
      })
    )

    return projectsWithMetrics
  } catch (error) {
    console.error('Error fetching team projects:', error)
    return []
  }
}

// Get team-specific tasks
export async function getTeamTasks(teamId: string, projectId?: string): Promise<Task[]> {
  try {
    // First get the team to get member IDs
    const team = await getTeamById(teamId)
    if (!team) {
      throw new Error('Team not found')
    }

    // Get member IDs
    const memberIds = team.members.map(member => member.userId)

    // Get all tasks
    let allTasks: Task[] = []

    // If projectId is provided, filter by project
    if (projectId) {
      const projectTasksQuery = query(
        collection(db, 'tasks'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      )
      const projectTasksSnapshot = await getDocs(projectTasksQuery)
      allTasks = projectTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Task)
    } else {
      // Otherwise get all tasks
      // Since we can't query by multiple assignedTo values efficiently,
      // we'll get all tasks and filter in memory
      const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
      const tasksSnapshot = await getDocs(tasksQuery)
      allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Task)
    }

    // Filter tasks to only include those assigned to team members
    return allTasks.filter(task => {
      // Pastikan assignedTo adalah array
      const assignedTo = Array.isArray(task.assignedTo)
        ? task.assignedTo
        : task.assignedTo
          ? [task.assignedTo]
          : [] // Konversi string ke array jika bukan array

      if (assignedTo.length > 0 && memberIds && memberIds.length > 0) {
        // Check if there is any intersection between assignedTo and memberIds
        return assignedTo.some(assigneeId => memberIds.includes(assigneeId))
      }
      return false // If task is unassigned or memberIds is empty, it won't match
    })
  } catch (error) {
    console.error('Error fetching team tasks:', error)
    return []
  }
}

// Get team activities
export async function getTeamActivities(teamId: string): Promise<Activity[]> {
  try {
    console.log(`Querying activities for teamId: ${teamId}`)

    // First try to query activities specifically related to this team
    let teamActivitiesQuery = query(
      collection(db, 'activities'),
      where('teamId', '==', teamId),
      orderBy('timestamp', 'desc'),
      limit(50)
    )

    let teamActivitiesSnapshot = await getDocs(teamActivitiesQuery)
    let activities = teamActivitiesSnapshot.docs.map(
      doc => ({ id: doc.id, ...doc.data() }) as Activity
    )

    console.log(`Found ${activities.length} activities with exact teamId match`)

    // If no activities found, try to get activities where teamId is in targetId
    // This is a fallback for older activities that might not have teamId field
    if (activities.length === 0) {
      console.log('No activities found with teamId field, trying targetId match')
      teamActivitiesQuery = query(
        collection(db, 'activities'),
        where('targetId', '==', teamId),
        where('type', '==', 'team'),
        orderBy('timestamp', 'desc'),
        limit(50)
      )

      teamActivitiesSnapshot = await getDocs(teamActivitiesQuery)
      activities = teamActivitiesSnapshot.docs.map(
        doc => ({ id: doc.id, ...doc.data() }) as Activity
      )
      console.log(`Found ${activities.length} activities with targetId match`)
    }

    // Get team data to include in activities that don't have targetName
    if (activities.length > 0) {
      const teamDoc = await getDoc(doc(db, 'teams', teamId))
      if (teamDoc.exists()) {
        const teamData = teamDoc.data() as Team

        // Add team name to activities that don't have targetName
        activities = activities.map(activity => {
          if (!activity.targetName && activity.type === 'team') {
            return { ...activity, targetName: teamData.name }
          }
          return activity
        })
      }
    }

    return activities
  } catch (error) {
    console.error('Error fetching team activities:', error)
    return []
  }
}

// Get team payroll data
export async function getTeamPayroll(teamId: string): Promise<PayrollData[]> {
  try {
    // First get the team to get member IDs
    const team = await getTeamById(teamId)
    if (!team) {
      throw new Error('Team not found')
    }

    // Get member IDs
    const memberIds = team.members.map(member => member.userId)

    // Get payroll data for each member
    const payrollData: PayrollData[] = []

    for (const memberId of memberIds) {
      // Get user data
      const userData = await getUserData(memberId)
      if (!userData) continue

      // Get tasks completed by this user
      const tasks = await getTasks(memberId)
      // Filter for tasks approved by admin ("done") and ensure taskRate is a number for sum
      const approvedTasks = tasks.filter(task => task.status === 'done')
      const taskEarnings = approvedTasks.reduce((sum, task) => sum + (task.taskRate || 0), 0)

      // Get attendance records for this user
      const attendanceRecords = await getAttendanceRecords(memberId)
      const attendanceEarnings = attendanceRecords.reduce(
        (sum, record) => sum + (record.earnings || 0),
        0
      )

      // Calculate base salary (simplified)
      const baseSalary = 0 // hourlyRate sudah tidak ada di UserData, set 0 atau implementasi lain jika perlu

      payrollData.push({
        id: memberId,
        userId: memberId,
        teamId: teamId,
        totalEarnings: baseSalary + taskEarnings + attendanceEarnings,
        taskCompletionBonus: taskEarnings,
        attendanceBonus: attendanceEarnings,
        baseSalary: baseSalary,
        tasksCompleted: approvedTasks.length,
        attendanceDays: attendanceRecords.length,
      })
    }

    return payrollData
  } catch (error) {
    console.error('Error fetching team payroll data:', error)
    return []
  }
}

// Get team members with user data
export async function getTeamMembersWithData(
  teamId: string
): Promise<Array<TeamMember & { userData: UserData | null }>> {
  try {
    const team = await getTeamById(teamId)
    if (!team) {
      throw new Error('Team not found')
    }

    const membersWithData = await Promise.all(
      team.members.map(async member => {
        const userData = await getUserData(member.userId)
        return {
          ...member,
          userData,
        }
      })
    )

    return membersWithData
  } catch (error) {
    console.error('Error fetching team members with data:', error)
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
    const teamRef = doc(db, 'teams', teamId)
    const teamDoc = await getDoc(teamRef)

    if (!teamDoc.exists()) {
      throw new Error(`Team with ID ${teamId} not found`)
    }

    const teamData = teamDoc.data() as Team
    const memberIndex = teamData.members.findIndex(m => m.userId === userId)

    if (memberIndex === -1) {
      throw new Error(`Member with userId ${userId} not found in team ${teamId}`)
    }

    const updatedMembers = [...teamData.members]
    // Merge existing member data with updates, ensuring required fields are preserved
    const existingMember = updatedMembers[memberIndex]
    if (!existingMember) {
      throw new Error(`Member at index ${memberIndex} not found`)
    }

    const updatedMember: TeamMember = {
      userId: existingMember.userId, // Preserve required userId
      role: memberUpdates.role ?? existingMember.role, // Use update or existing
      joinedAt: existingMember.joinedAt, // Preserve required joinedAt
    }

    // Only add status if it exists (since it's optional)
    if (memberUpdates.status !== undefined) {
      updatedMember.status = memberUpdates.status
    } else if (existingMember.status !== undefined) {
      updatedMember.status = existingMember.status
    }

    updatedMembers[memberIndex] = updatedMember

    // Cek jika member yang diupdate adalah leader
    let updateData: any = {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    }
    if (teamData.lead && teamData.lead.userId === userId && memberUpdates.role) {
      updateData = {
        ...updateData,
        lead: {
          ...teamData.lead,
          role: memberUpdates.role,
        },
      }
    }

    await updateDoc(teamRef, updateData)

    // Optional: Add activity log for member update
    const actor = auth.currentUser
    const actorData = actor ? await getUserData(actor.uid) : null
    const actorName = actorData?.displayName || actor?.email || 'System'

    const updatedMemberData = await getUserData(userId)
    const updatedMemberName = updatedMemberData?.displayName || `user (${userId.substring(0, 6)})`

    await addActivity({
      userId: actor?.uid || 'system', // Actor ID
      type: 'team', // Could also be "user" if focusing on the user being modified within a team context
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
        teamName: teamData.name, // Adding teamName for context
      },
    })
  } catch (error) {
    console.error('Error updating team member details:', error)
    throw error
  }
}

// Get team metrics
export async function getTeamMetrics(teamId: string): Promise<TeamMetrics> {
  try {
    // Get the team
    const team = await getTeamById(teamId)
    if (!team) {
      throw new Error('Team not found')
    }

    // Get team's active projects
    const projects = await getTeamProjects(teamId)
    const activeProjects = projects.filter(project => project.status === 'in-progress')

    // Calculate aggregate metrics from all active projects
    let totalProjectTasks = 0
    let totalCompletedTasks = 0

    // Get tasks for each active project
    for (const project of activeProjects) {
      const projectTasks = await getTeamTasks(teamId, project.id)
      totalProjectTasks += projectTasks.length
      totalCompletedTasks += projectTasks.filter(task => task.status === 'completed').length
    }

    // Calculate completion rate
    const completionRate =
      totalProjectTasks > 0 ? Math.round((totalCompletedTasks / totalProjectTasks) * 100) : 0

    return {
      totalMembers: team.members.length,
      activeProjects: activeProjects.length,
      pendingTasks: totalProjectTasks - totalCompletedTasks,
      completedTasks: totalCompletedTasks,
      totalTasks: totalProjectTasks,
      completionRate,
    }
  } catch (error) {
    console.error('Error calculating team metrics:', error)
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
export async function addActivity(
  activity: Omit<Activity, 'id' | 'timestamp'> & { timestamp?: Timestamp | FieldValue }
): Promise<void> {
  try {
    const activitiesRef = collection(db, 'activities')
    await addDoc(activitiesRef, {
      ...activity,
      timestamp: activity.timestamp || serverTimestamp(),
    })
  } catch (error) {
    console.error('Error adding activity:', error)
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
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('email', '==', email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty || querySnapshot.docs.length === 0) {
      console.log(`No user found with email: ${email}`)
      return null
    }
    // Assuming email is unique, return the first match
    const userDoc = querySnapshot.docs[0]
    if (!userDoc) {
      console.log(`No user document found with email: ${email}`)
      return null
    }
    return { id: userDoc.id, ...userDoc.data() } as UserData
  } catch (error) {
    console.error('Error fetching user by email:', error)
    return null
  }
}

export async function getUsers(): Promise<UserData[]> {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'))
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as UserData)
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export { Timestamp }

// Get available users for team member selection (excluding admins and existing members)
export async function getAvailableUsersForTeam(teamId: string): Promise<UserData[]> {
  try {
    // Get current team members to exclude them
    const team = await getTeamById(teamId)
    const currentMemberIds = team ? team.members.map(m => m.userId) : []

    // Get all regular users (non-admin) who are not yet team members
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'employee'))

    const usersSnapshot = await getDocs(usersQuery)
    const availableUsers = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as UserData)
      .filter(user => {
        // Additional validation checks
        const isNotCurrentMember = !currentMemberIds.includes(user.id)
        const isRegularUser = user.role === 'employee'
        const isActiveUser = user.status !== 'inactive' // Optional: only show active users

        return isNotCurrentMember && isRegularUser && isActiveUser
      })

    // Sort users by name for better UX
    return availableUsers.sort((a, b) =>
      (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '')
    )
  } catch (error) {
    console.error('Error fetching available users:', error)
    throw new Error('Failed to fetch available users for team')
  }
}

// Get unique team roles from all teams in the database
export async function getUniqueTeamRoles(): Promise<string[]> {
  try {
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const allRoles = new Set<string>()

    teamsSnapshot.docs.forEach(doc => {
      const team = doc.data() as Team
      if (team.members && Array.isArray(team.members)) {
        team.members.forEach(member => {
          if (member.role && typeof member.role === 'string' && member.role.trim()) {
            allRoles.add(member.role.trim())
          }
        })
      }
    })

    // Convert Set to Array and sort alphabetically
    return Array.from(allRoles).sort((a, b) => a.localeCompare(b))
  } catch (error) {
    console.error('Error fetching unique team roles:', error)
    return []
  }
}

// Get unique team roles for a specific team
export async function getTeamRoles(teamId: string): Promise<string[]> {
  try {
    const team = await getTeamById(teamId)
    if (!team || !team.members) {
      return []
    }

    const roles = new Set<string>()
    team.members.forEach(member => {
      if (member.role && typeof member.role === 'string' && member.role.trim()) {
        roles.add(member.role.trim())
      }
    })

    return Array.from(roles).sort((a, b) => a.localeCompare(b))
  } catch (error) {
    console.error('Error fetching team roles:', error)
    return []
  }
}

// Function to add an existing project to a team
export async function addExistingProjectToTeam(
  teamId: string,
  projectId: string
): Promise<Project> {
  const projectRef = doc(db, 'projects', projectId)
  const projectSnap = await getDoc(projectRef)

  if (!projectSnap.exists()) {
    throw new Error(`Project with ID ${projectId} tidak ditemukan.`)
  }

  const projectData = projectSnap.data() as Project
  const isAlreadyInTeam = projectData.teams.includes(teamId)

  if (isAlreadyInTeam) {
    throw new Error('Project sudah ada di tim ini.')
  }

  try {
    await updateDoc(projectRef, {
      teams: arrayUnion(teamId),
      updatedAt: serverTimestamp(),
    })

    // Log aktivitas
    const actor = auth.currentUser
    const actorId = actor?.uid || 'system'
    const actorData = actor ? await getUserData(actor.uid) : null
    const actorName = actorData?.displayName || actor?.email || 'System'

    await addActivity({
      userId: actorId,
      type: 'project',
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
    })

    // Ambil data project terbaru
    const updatedSnap = await getDoc(projectRef)
    return { id: updatedSnap.id, ...updatedSnap.data() } as Project
  } catch (error) {
    console.error('Gagal menambahkan project ke tim:', error)
    throw new Error('Gagal menambahkan project ke tim.')
  }
}

export async function setTeamLeader(teamId: string, member: TeamMember, userData: UserData) {
  const teamRef = doc(db, 'teams', teamId)
  await updateDoc(teamRef, {
    lead: {
      userId: member.userId,
      name: userData.displayName || userData.email || '',
      email: userData.email || '',
      phone: userData.phoneNumber || '',
      role: member.role,
      photoURL: userData.photoURL || '',
    },
    updatedAt: serverTimestamp(),
  })
}

export async function removeTeamFromProject(projectId: string, teamId: string): Promise<void> {
  const projectRef = doc(db, 'projects', projectId)
  const projectSnap = await getDoc(projectRef)
  if (!projectSnap.exists()) {
    throw new Error(`Project dengan ID ${projectId} tidak ditemukan.`)
  }
  const projectData = projectSnap.data() as Project
  const updatedTeams = projectData.teams.filter((id: string) => id !== teamId)
  await updateDoc(projectRef, {
    teams: updatedTeams,
    updatedAt: serverTimestamp(),
  })
  // Log aktivitas
  const actor = auth.currentUser
  const actorId = actor?.uid || 'system'
  const actorData = actor ? await getUserData(actor.uid) : null
  const actorName = actorData?.displayName || actor?.email || 'System'
  await addActivity({
    userId: actorId,
    type: 'project',
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
  })
}

// Update a project
export async function updateProject(
  projectId: string,
  projectData: Partial<Project>
): Promise<Project> {
  try {
    const projectRef = doc(db, 'projects', projectId)
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: serverTimestamp(),
    })

    // Add activity log
    await addActivity({
      userId: projectData.createdBy || 'system',
      type: 'project',
      action: ActivityActionType.PROJECT_UPDATED,
      targetId: projectId,
      targetName: projectData.name || 'Unknown Project',
      timestamp: serverTimestamp(),
      details: { ...projectData },
    })

    // Get the updated project data
    const updatedProjectDoc = await getDoc(projectRef)
    if (!updatedProjectDoc.exists()) {
      throw new Error('Project not found after update')
    }
    return { id: updatedProjectDoc.id, ...updatedProjectDoc.data() } as Project
  } catch (error) {
    console.error('Error updating project:', error)
    throw error
  }
}

// Get a specific project by ID
export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const projectDoc = await getDoc(doc(db, 'projects', projectId))
    if (projectDoc.exists()) {
      return { id: projectDoc.id, ...projectDoc.data() } as Project
    }
    return null
  } catch (error) {
    console.error('Error fetching project:', error)
    return null
  }
}

// Delete a project
export async function deleteProject(projectId: string): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId)
    const projectDoc = await getDoc(projectRef)
    if (!projectDoc.exists()) {
      throw new Error('Project not found')
    }
    const projectData = projectDoc.data() as Project
    await deleteDoc(projectRef)
    // Add activity log
    await addActivity({
      userId: auth.currentUser?.uid || 'system',
      type: 'project',
      action: ActivityActionType.PROJECT_DELETED,
      targetId: projectId,
      targetName: projectData.name,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    throw new Error('Failed to delete project')
  }
}

// Ambil seluruh activity yang terkait dengan project tertentu
export async function getProjectActivities(projectId: string): Promise<Activity[]> {
  try {
    // Ambil activity yang targetId-nya sama dengan projectId (langsung terkait project)
    const directQuery = query(
      collection(db, 'activities'),
      where('targetId', '==', projectId),
      orderBy('timestamp', 'desc'),
      limit(50)
    )
    const directSnap = await getDocs(directQuery)
    const activities = directSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Activity)

    // Ambil activity yang details.projectId == projectId (misal aktivitas pada task, team, dsb yang menyimpan projectId di details)
    const allActivitiesSnap = await getDocs(query(collection(db, 'activities')))
    const relatedActivities = allActivitiesSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as Activity)
      .filter(act => act.details && act.details.projectId === projectId)

    // Gabungkan dan hilangkan duplikat
    const all = [...activities, ...relatedActivities]
    const unique = Array.from(new Map(all.map(a => [a.id, a])).values())
    // Urutkan terbaru dulu
    unique.sort((a, b) => {
      const ta = (a.timestamp as any)?.seconds || 0
      const tb = (b.timestamp as any)?.seconds || 0
      return tb - ta
    })
    return unique
  } catch (error) {
    console.error('Error fetching project activities:', error)
    return []
  }
}

// Mark all activities as read for current user
export async function markAllActivitiesAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'activities'),
    where('userId', '==', userId),
    where('status', '==', 'unread')
  )
  const snap = await getDocs(q)
  const batch = (await import('firebase/firestore')).writeBatch(db)
  snap.forEach(docSnap => {
    batch.update(doc(db, 'activities', docSnap.id), { status: 'read' })
  })
  await batch.commit()
}

// Mark individual activity as read
export async function markActivityAsRead(activityId: string): Promise<void> {
  try {
    const activityRef = doc(db, 'activities', activityId)
    await updateDoc(activityRef, { status: 'read' })
  } catch (error) {
    console.error('Error marking activity as read:', error)
    throw error
  }
}

export async function activateUser(adminUserId: string, userIdToActivate: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userIdToActivate)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error('User to activate not found.')
    }

    const userData = userDoc.data() as UserData

    if (userData.status === 'active') {
      // console.log("User is already active.");
      // return; // Atau throw error jika dianggap tidak valid
      throw new Error('User is already active.')
    }

    const now = serverTimestamp()
    await updateDoc(userRef, {
      status: 'active',
      updatedAt: now,
    })

    // 1. Notifikasi ke user yang diaktivasi
    await addActivity({
      userId: userIdToActivate, // Notifikasi untuk user yang bersangkutan
      type: 'user',
      action: ActivityActionType.USER_ACTIVATED,
      targetId: userIdToActivate,
      targetName: userData.displayName || userData.email || 'Unknown User',
      timestamp: now,
      status: 'unread',
      details: {
        message: 'Your account has been activated. You can now log in.',
      },
    })

    // 2. Catat aktivitas bahwa admin mengaktivasi user (untuk log admin/sistem)
    const adminUser = await getUserData(adminUserId) // Ambil data admin yang melakukan aksi
    await addActivity({
      userId: adminUserId, // Admin yang melakukan aksi
      type: 'user',
      action: ActivityActionType.USER_ACTIVATED, // Menggunakan tipe aksi yang lebih spesifik untuk log admin
      targetId: userIdToActivate,
      targetName: userData.displayName || userData.email || 'Unknown User',
      timestamp: now,
      status: 'unread', // Ubah menjadi unread agar muncul di notifikasi admin
      details: {
        message: `Activated user: ${userData.displayName || userData.email}`,
        activatedUserId: userIdToActivate,
        adminActor: adminUser?.displayName || adminUserId,
      },
    })
  } catch (error) {
    console.error('Error activating user:', error)
    throw error
  }
}

// Fungsi baru untuk menghapus data pengguna dari Firestore
export async function deleteUserRecord(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await deleteDoc(userRef)
    // PENTING: Ini HANYA menghapus data dari Firestore.
    // Penghapusan dari Firebase Authentication HARUS ditangani secara terpisah,
    // idealnya melalui backend (Cloud Function) menggunakan Admin SDK
    // untuk memastikan keamanan dan hak akses yang benar.
    // Jika tidak, akun di Firebase Auth akan menjadi yatim.
    // Komponen UI yang memanggil fungsi ini sebaiknya menangani notifikasi.
    console.info(
      'User record deleted from Firestore. Firebase Auth account may still exist if not handled by a backend process.'
    )
  } catch (error) {
    console.error('Error deleting user record from Firestore:', error)
    throw error
  }
}

// Earning Functions - NEW
/**
 * Creates a new earning record in Firestore and logs an activity.
 * @param earningData Data for the new earning (excluding id and createdAt).
 * @returns The ID of the newly created earning document.
 */
export async function createEarning(
  earningData: Omit<Earning, 'id' | 'createdAt'>
): Promise<string> {
  const earningRef = await addDoc(collection(db, 'earnings'), {
    ...earningData,
    createdAt: serverTimestamp(),
  })

  await addActivity({
    userId: earningData.userId,
    type: 'earning',
    action: ActivityActionType.EARNING_CREATED,
    targetId: earningRef.id,
    targetName: `Earning for ${earningData.userId}`,
    timestamp: serverTimestamp(),
    details: {
      amount: earningData.amount,
      type: earningData.type,
      refId: earningData.refId,
    },
  })

  return earningRef.id
}

// Milestone Functions
export async function addMilestoneToProject(
  projectId: string,
  milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const projectRef = doc(db, 'projects', projectId)
    const projectDoc = await getDoc(projectRef)

    if (!projectDoc.exists()) {
      throw new Error('Project not found')
    }

    const projectData = projectDoc.data() as Project
    const currentMilestones = projectData.milestones || []

    // Generate new milestone ID
    const milestoneId = `milestone_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const now = Timestamp.now()
    const newMilestone: Milestone = {
      ...milestone,
      id: milestoneId,
      createdAt: now,
      updatedAt: now,
    }

    await updateDoc(projectRef, {
      milestones: [...currentMilestones, newMilestone],
      updatedAt: serverTimestamp(),
    })

    // Add activity log
    await addActivity({
      userId: auth.currentUser?.uid || 'system',
      type: 'project',
      action: ActivityActionType.PROJECT_UPDATED,
      targetId: projectId,
      targetName: projectData.name,
      timestamp: serverTimestamp(),
      details: {
        action: 'milestone_added',
        milestoneTitle: milestone.title,
        milestoneDueDate: milestone.dueDate,
      },
    })

    return milestoneId
  } catch (error) {
    console.error('Error adding milestone to project:', error)
    throw error
  }
}

export async function updateMilestone(
  projectId: string,
  milestoneId: string,
  milestoneData: Partial<Milestone>
): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId)
    const projectDoc = await getDoc(projectRef)

    if (!projectDoc.exists()) {
      throw new Error('Project not found')
    }

    const projectData = projectDoc.data() as Project
    const currentMilestones = projectData.milestones || []

    const milestoneIndex = currentMilestones.findIndex(m => m.id === milestoneId)
    if (milestoneIndex === -1) {
      throw new Error('Milestone not found')
    }

    const updatedMilestones = [...currentMilestones]
    updatedMilestones[milestoneIndex] = {
      ...updatedMilestones[milestoneIndex],
      ...milestoneData,
      updatedAt: Timestamp.now(),
    }

    await updateDoc(projectRef, {
      milestones: updatedMilestones,
      updatedAt: serverTimestamp(),
    })

    // Add activity log
    await addActivity({
      userId: auth.currentUser?.uid || 'system',
      type: 'project',
      action: ActivityActionType.PROJECT_UPDATED,
      targetId: projectId,
      targetName: projectData.name,
      timestamp: serverTimestamp(),
      details: {
        action: 'milestone_updated',
        milestoneId: milestoneId,
        milestoneTitle: milestoneData.title || updatedMilestones[milestoneIndex].title,
      },
    })
  } catch (error) {
    console.error('Error updating milestone:', error)
    throw error
  }
}

export async function deleteMilestone(projectId: string, milestoneId: string): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId)
    const projectDoc = await getDoc(projectRef)

    if (!projectDoc.exists()) {
      throw new Error('Project not found')
    }

    const projectData = projectDoc.data() as Project
    const currentMilestones = projectData.milestones || []

    const milestoneToDelete = currentMilestones.find(m => m.id === milestoneId)
    if (!milestoneToDelete) {
      throw new Error('Milestone not found')
    }

    const updatedMilestones = currentMilestones.filter(milestone => milestone.id !== milestoneId)

    await updateDoc(projectRef, {
      milestones: updatedMilestones,
      updatedAt: serverTimestamp(),
    })

    // Add activity log
    await addActivity({
      userId: auth.currentUser?.uid || 'system',
      type: 'project',
      action: ActivityActionType.PROJECT_UPDATED,
      targetId: projectId,
      targetName: projectData.name,
      timestamp: serverTimestamp(),
      details: {
        action: 'milestone_deleted',
        milestoneId: milestoneId,
        milestoneTitle: milestoneToDelete.title,
      },
    })
  } catch (error) {
    console.error('Error deleting milestone:', error)
    throw error
  }
}

/**
 * Retrieves all earnings for a specific user, ordered by creation date.
 * @param userId The ID of the user whose earnings are to be fetched.
 * @returns A promise that resolves to an array of Earning objects.
 */
export async function getEarningsByUserId(userId: string): Promise<Earning[]> {
  const earningsCol = collection(db, 'earnings')
  const q = query(earningsCol, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const querySnapshot = await getDocs(q)
  const earnings: Earning[] = []
  querySnapshot.forEach(doc => {
    earnings.push({ id: doc.id, ...doc.data() } as Earning)
  })
  return earnings
}

/**
 * Subscribe to real-time updates of earnings for a specific user.
 * @param userId The ID of the user.
 * @param callback Callback invoked with an array of Earnings on data change.
 * @param errorCallback Callback invoked when an error occurs.
 * @returns Unsubscribe function to stop listening.
 */
export function subscribeEarningsByUserId(
  userId: string,
  callback: (earnings: Earning[]) => void,
  errorCallback?: (error: any) => void
): Unsubscribe {
  const earningsCol = collection(db, 'earnings')
  const q = query(earningsCol, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snapshot => {
      const data: Earning[] = snapshot.docs.map(
        doc => ({ id: doc.id, ...(doc.data() as any) }) as Earning
      )
      callback(data)
    },
    error => {
      console.error('Error in subscribeEarningsByUserId:', error)
      if (errorCallback) {
        errorCallback(error)
      }
    }
  )
}

/**
 * Subscribe to real-time updates of all earnings (admin view).
 * @param callback Callback invoked with an array of Earnings on data change.
 * @param errorCallback Callback invoked when an error occurs.
 * @returns Unsubscribe function to stop listening.
 */
export function subscribeAllEarnings(
  callback: (earnings: Earning[]) => void,
  errorCallback?: (error: any) => void
): Unsubscribe {
  const earningsCol = collection(db, 'earnings')
  const q = query(earningsCol, orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snapshot => {
      const data: Earning[] = snapshot.docs.map(
        doc => ({ id: doc.id, ...(doc.data() as any) }) as Earning
      )
      callback(data)
    },
    error => {
      console.error('Error in subscribeAllEarnings:', error)
      if (errorCallback) {
        errorCallback(error)
      }
    }
  )
}
