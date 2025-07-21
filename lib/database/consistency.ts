/**
 * Data Consistency Manager for Project Management
 *
 * This module ensures data integrity and consistency across related entities
 * in the project management system.
 */

import type { Milestone, Project, ProjectMetrics, Task } from '@/types/database'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Update project metrics when tasks change
 */
export async function updateProjectMetrics(projectId: string): Promise<void> {
  try {
    // Get all tasks for the project
    const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId))
    const tasksSnapshot = await getDocs(tasksQuery)
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Task)

    // Calculate metrics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(
      task => task.status === 'completed' || task.status === 'done'
    ).length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Get unique active members (users with tasks in progress)
    const activeMembers = new Set(
      tasks
        .filter(task => task.status === 'in_progress' && task.assignedTo)
        .flatMap(task => task.assignedTo || [])
    ).size

    const metrics: ProjectMetrics = {
      totalTasks,
      completedTasks,
      completionRate,
      activeMembers,
      pendingTasks: totalTasks - completedTasks,
      totalTeams: 0,
      activeMilestones: 0,
    }

    // Update project with new metrics
    const projectRef = doc(db, 'projects', projectId)
    await updateDoc(projectRef, {
      metrics,
      lastActivityAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Update milestone progress based on related tasks
    await updateMilestoneProgress(projectId, tasks)
  } catch (error) {
    console.error('Error updating project metrics:', error)
    throw error
  }
}

/**
 * Calculate milestone progress based on related tasks
 * Tasks are considered related if their deadline is on or before the milestone due date
 */
function calculateMilestoneProgress(milestone: Milestone, tasks: Task[]): number {
  const relatedTasks = tasks.filter(task => task.deadline.toDate() <= milestone.dueDate.toDate())

  if (relatedTasks.length === 0) return 0

  const completedTasks = relatedTasks.filter(
    task => task.status === 'completed' || task.status === 'done'
  ).length

  return Math.round((completedTasks / relatedTasks.length) * 100)
}

/**
 * Update milestone progress and status based on related tasks
 */
async function updateMilestoneProgress(projectId: string, tasks: Task[]): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId)
    const projectDoc = await getDoc(projectRef)

    if (!projectDoc.exists()) return

    const project = projectDoc.data() as Project
    const milestones = project.milestones || []

    // Update each milestone's progress
    const updatedMilestones = milestones.map(milestone => {
      const calculatedProgress = calculateMilestoneProgress(milestone, tasks)

      // Auto-update milestone status based on progress and due date
      let newStatus = milestone.status
      const now = new Date()
      const dueDate = milestone.dueDate.toDate()

      if (calculatedProgress === 100) {
        newStatus = 'completed'
      } else if (calculatedProgress > 0 && milestone.status === 'not-started') {
        newStatus = 'in-progress'
      } else if (dueDate < now && newStatus !== 'completed') {
        newStatus = 'overdue'
      }

      return {
        ...milestone,
        progress: calculatedProgress,
        status: newStatus,
        updatedAt: Timestamp.now(),
      }
    })

    // Update project with new milestone data
    await updateDoc(projectRef, {
      milestones: updatedMilestones,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating milestone progress:', error)
  }
}

/**
 * Export function to calculate milestone progress for display purposes
 */
export function getMilestoneProgress(
  milestone: Milestone,
  tasks: Task[]
): {
  progress: number
  relatedTasksCount: number
  completedTasksCount: number
} {
  const relatedTasks = tasks.filter(task => task.deadline.toDate() <= milestone.dueDate.toDate())

  const completedTasks = relatedTasks.filter(
    task => task.status === 'completed' || task.status === 'done'
  )

  const progress =
    relatedTasks.length > 0 ? Math.round((completedTasks.length / relatedTasks.length) * 100) : 0

  return {
    progress,
    relatedTasksCount: relatedTasks.length,
    completedTasksCount: completedTasks.length,
  }
}

/**
 * Maintain project-task relationship consistency
 */
export async function maintainProjectTaskRelationship(
  projectId: string,
  taskId: string,
  operation: 'add' | 'remove'
): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId)
    const projectDoc = await getDoc(projectRef)

    if (!projectDoc.exists()) {
      throw new Error('Project not found')
    }

    const project = projectDoc.data() as Project
    const currentTaskIds = project.taskIds || []

    let updatedTaskIds: string[]

    if (operation === 'add' && !currentTaskIds.includes(taskId)) {
      updatedTaskIds = [...currentTaskIds, taskId]
    } else if (operation === 'remove') {
      updatedTaskIds = currentTaskIds.filter(id => id !== taskId)
    } else {
      return // No change needed
    }

    await updateDoc(projectRef, {
      taskIds: updatedTaskIds,
      updatedAt: serverTimestamp(),
    })

    // Update project metrics after relationship change
    await updateProjectMetrics(projectId)
  } catch (error) {
    console.error('Error maintaining project-task relationship:', error)
    throw error
  }
}

/**
 * Validate and fix data inconsistencies
 */
export async function validateProjectConsistency(projectId: string): Promise<{
  isConsistent: boolean
  issues: string[]
  fixed: string[]
}> {
  const issues: string[] = []
  const fixed: string[] = []

  try {
    // Get project data
    const projectRef = doc(db, 'projects', projectId)
    const projectDoc = await getDoc(projectRef)

    if (!projectDoc.exists()) {
      return { isConsistent: false, issues: ['Project not found'], fixed: [] }
    }

    const project = projectDoc.data() as Project

    // Check 1: Verify all taskIds exist and belong to project
    if (project.taskIds && project.taskIds.length > 0) {
      const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId))
      const tasksSnapshot = await getDocs(tasksQuery)
      const actualTaskIds = tasksSnapshot.docs.map(doc => doc.id)

      // Find orphaned task IDs in project
      const orphanedTaskIds = project.taskIds.filter(id => !actualTaskIds.includes(id))
      if (orphanedTaskIds.length > 0) {
        issues.push(`Found ${orphanedTaskIds.length} orphaned task IDs in project`)

        // Fix: Remove orphaned task IDs
        const cleanTaskIds = project.taskIds.filter(id => actualTaskIds.includes(id))
        await updateDoc(projectRef, { taskIds: cleanTaskIds })
        fixed.push('Removed orphaned task IDs from project')
      }

      // Find tasks not referenced in project
      const unreferencedTasks = actualTaskIds.filter(id => !(project.taskIds || []).includes(id))
      if (unreferencedTasks.length > 0) {
        issues.push(`Found ${unreferencedTasks.length} tasks not referenced in project`)

        // Fix: Add missing task IDs
        const completeTaskIds = [...(project.taskIds || []), ...unreferencedTasks]
        await updateDoc(projectRef, { taskIds: completeTaskIds })
        fixed.push('Added missing task IDs to project')
      }
    }

    // Check 2: Verify team assignments
    if (project.teams && project.teams.length > 0) {
      for (const teamId of project.teams) {
        const teamRef = doc(db, 'teams', teamId)
        const teamDoc = await getDoc(teamRef)

        if (!teamDoc.exists()) {
          issues.push(`Project references non-existent team: ${teamId}`)
          // Note: We don't auto-fix this as it might be intentional
        }
      }
    }

    // Check 3: Validate milestone dates
    if (project.milestones && project.milestones.length > 0) {
      const projectStart = project.createdAt.toDate()
      const projectEnd = project.deadline.toDate()

      for (const milestone of project.milestones) {
        const milestoneDate = milestone.dueDate.toDate()

        if (milestoneDate < projectStart) {
          issues.push(`Milestone "${milestone.title}" due date is before project start`)
        }

        if (milestoneDate > projectEnd) {
          issues.push(`Milestone "${milestone.title}" due date is after project deadline`)
        }
      }
    }

    // Update metrics to ensure they're current
    await updateProjectMetrics(projectId)
    if (issues.length === 0) {
      fixed.push('Updated project metrics')
    }

    return {
      isConsistent: issues.length === 0,
      issues,
      fixed,
    }
  } catch (error) {
    console.error('Error validating project consistency:', error)
    return {
      isConsistent: false,
      issues: [`Validation failed: ${error}`],
      fixed,
    }
  }
}

/**
 * Cascade operations when project is deleted
 */
export async function cascadeProjectDeletion(projectId: string): Promise<void> {
  const batch = writeBatch(db)

  try {
    // Get all tasks for the project
    const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId))
    const tasksSnapshot = await getDocs(tasksQuery)

    // Mark tasks as orphaned or delete them
    tasksSnapshot.docs.forEach(taskDoc => {
      // Option 1: Delete tasks
      batch.delete(taskDoc.ref)

      // Option 2: Mark as orphaned (uncomment if preferred)
      // batch.update(taskDoc.ref, {
      //   projectId: null,
      //   status: 'orphaned',
      //   updatedAt: serverTimestamp()
      // })
    })

    // Remove project from all teams
    const teamsQuery = query(collection(db, 'teams'))
    const teamsSnapshot = await getDocs(teamsQuery)

    teamsSnapshot.docs.forEach(teamDoc => {
      const teamData = teamDoc.data()
      if (teamData.projects && teamData.projects.includes(projectId)) {
        const updatedProjects = teamData.projects.filter((id: string) => id !== projectId)
        batch.update(teamDoc.ref, {
          projects: updatedProjects,
          updatedAt: serverTimestamp(),
        })
      }
    })

    await batch.commit()
  } catch (error) {
    console.error('Error cascading project deletion:', error)
    throw error
  }
}
