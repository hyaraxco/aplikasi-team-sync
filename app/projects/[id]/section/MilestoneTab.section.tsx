'use client'

import { Badge } from '@/components/atomics/badge'
import { Button } from '@/components/atomics/button'
import { Skeleton } from '@/components/atomics/skeleton'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent } from '@/components/molecules/card'
import { EmptyState } from '@/components/molecules/data-display/EmptyState'
import { getProjectPermissions, usePermissions, validateMilestoneOperation } from '@/hooks'
import {
  getMilestoneProgress,
  getProjectById,
  getTasks,
  getTeamById,
  updateProjectMetrics,
} from '@/lib/database'
import type { Milestone, Project, Task, Team } from '@/types'
import { format } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { AlertTriangle, Calendar, CheckCircle, Circle, Edit, Plus, Trash } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AddMilestoneDialog } from '../dialog/addMilestone.project'
import { DeleteMilestoneDialog } from '../dialog/deleteMilestone.project'
import { EditMilestoneDialog } from '../dialog/editMilestone.project'

interface MilestonesTabProps {
  projectId: string
}

export const MilestoneTab: React.FC<MilestonesTabProps> = ({ projectId }) => {
  const { user, userRole } = useAuth()
  const permissionSystem = usePermissions({ projectId })

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [userTeams, setUserTeams] = useState<Team[]>([])
  const [projectTasks, setProjectTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState({
    canView: false,
    canEdit: false,
    canDelete: false,
    canCreateMilestones: false,
  })

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)

  // Validation states
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Enhanced fetch function with permission checking and data validation
  const fetchMilestones = useCallback(async () => {
    if (!user) {
      setError('Authentication required')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setValidationErrors([])

    try {
      // Fetch project data
      const projectData = await getProjectById(projectId)
      if (!projectData) {
        setError('Project not found')
        setLoading(false)
        return
      }

      setProject(projectData)

      // Fetch user teams for permission checking
      const teamPromises = projectData.teams.map((teamId: string) => getTeamById(teamId))
      const teams = await Promise.all(teamPromises)
      const validTeams = teams.filter((team: Team | null) => team !== null) as Team[]
      setUserTeams(validTeams)

      // Fetch project tasks for progress calculation
      const tasks = await getTasks(user.uid, projectId, userRole || 'employee')
      setProjectTasks(tasks)

      // Calculate permissions
      const projectPermissions = getProjectPermissions(
        { userId: user.uid, userRole: userRole || 'employee', projectId },
        projectData,
        validTeams
      )

      setPermissions({
        canView: projectPermissions.canView,
        canEdit: projectPermissions.canEdit,
        canDelete: projectPermissions.canDelete,
        canCreateMilestones: projectPermissions.canCreateMilestones,
      })

      // Check if user can view milestones
      if (!projectPermissions.canView) {
        setError('You do not have permission to view this project')
        setLoading(false)
        return
      }

      // Set milestones with calculated progress
      const milestones = projectData.milestones || []
      setMilestones(milestones)

      // Validate milestone data and show warnings - only for admin
      if (userRole === 'admin') {
        const warnings: string[] = []
        milestones.forEach((milestone: Milestone) => {
          const validation = validateMilestoneOperation(milestone, projectData, {
            userId: user.uid,
            userRole: userRole || 'employee',
            projectId,
          })
          if (!validation.valid && validation.reason) {
            warnings.push(`${milestone.title}: ${validation.reason}`)
          }
        })

        if (warnings.length > 0) {
          setValidationErrors(warnings)
        }
      }
    } catch (err) {
      console.error('Error fetching milestones:', err)
      setError('Failed to load milestones')
      toast.error('Failed to load milestones')
    } finally {
      setLoading(false)
    }
  }, [projectId, user, userRole])

  useEffect(() => {
    fetchMilestones()
  }, [fetchMilestones])

  // Enhanced milestone operation handlers with permission checks
  const handleAddMilestone = () => {
    if (!permissions.canCreateMilestones) {
      toast.error('You do not have permission to create milestones')
      return
    }

    if (!project) {
      toast.error('Project data not loaded')
      return
    }

    // Validate project status
    if (project.status === 'completed') {
      toast.error('Cannot add milestones to completed projects')
      return
    }

    setSelectedMilestone(null)
    setAddDialogOpen(true)
  }

  const handleEditMilestone = async (milestone: Milestone) => {
    if (!permissions.canEdit) {
      toast.error('You do not have permission to edit milestones')
      return
    }

    if (!project) {
      toast.error('Project data not loaded')
      return
    }

    // Validate milestone operation using the unified permission system
    const validation = await permissionSystem.validateOperation('editMilestone', {
      milestone,
      project,
    })

    if (!('valid' in validation ? validation.valid : validation.allowed)) {
      toast.error(validation.reason || 'Cannot edit this milestone')
      return
    }

    setSelectedMilestone(milestone)
    setEditDialogOpen(true)
  }

  const handleDeleteMilestone = (milestone: Milestone) => {
    if (!permissions.canDelete) {
      toast.error('You do not have permission to delete milestones')
      return
    }

    if (!project) {
      toast.error('Project data not loaded')
      return
    }

    // Additional validation for deletion
    if (project.status === 'completed') {
      toast.error('Cannot delete milestones from completed projects')
      return
    }

    setSelectedMilestone(milestone)
    setDeleteDialogOpen(true)
  }

  // Enhanced callback with data consistency updates
  const handleMilestoneChange = async () => {
    try {
      // Refresh milestone data
      await fetchMilestones()

      // Update project metrics to maintain consistency
      await updateProjectMetrics(projectId)

      toast.success('Project metrics updated')
    } catch (error) {
      console.error('Error updating project metrics:', error)
      // Don't show error toast for metrics update failure
      // as the main operation was successful
    }
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'not-started':
        return 'bg-gray-100 text-gray-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (timestamp: Timestamp) => {
    return format(timestamp.toDate(), 'MMM d, yyyy')
  }

  const isOverdue = (dueDate: Timestamp, status: string) => {
    return status !== 'completed' && dueDate.toDate() < new Date()
  }

  const getStatusDisplay = (status: string) => {
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className='space-y-4 sm:space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-4 w-64 mt-1' />
          </div>
          <Skeleton className='h-10 w-32' />
        </div>
        <div className='space-y-4'>
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className='p-4 sm:p-6'>
                <div className='flex gap-3 sm:gap-4'>
                  <Skeleton className='w-6 h-6 rounded-full flex-shrink-0' />
                  <div className='flex-1 space-y-3'>
                    <Skeleton className='h-6 w-3/4' />
                    <Skeleton className='h-4 w-full' />
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-4 w-24' />
                    </div>
                    <Skeleton className='h-2 w-full rounded-full' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className='space-y-4 sm:space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h3 className='text-lg sm:text-xl font-semibold'>Project Milestones</h3>
            <p className='text-sm text-muted-foreground mt-1'>
              Track major project milestones and deliverables
            </p>
          </div>
          {userRole === 'admin' && (
            <Button
              onClick={handleAddMilestone}
              className='flex items-center gap-2 w-full sm:w-auto'
            >
              <Plus className='w-4 h-4' />
              Add Milestone
            </Button>
          )}
        </div>
        <div className='text-center py-8'>
          <p className='text-red-600'>{error}</p>
          <Button variant='outline' onClick={fetchMilestones} className='mt-2'>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Header - Responsive */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h3 className='text-lg sm:text-xl font-semibold'>Project Milestones</h3>
          <p className='text-sm text-muted-foreground mt-1'>
            Track major project milestones and deliverables
          </p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={handleAddMilestone} className='flex items-center gap-2 w-full sm:w-auto'>
            <Plus className='w-4 h-4' />
            Add Milestone
          </Button>
        )}
      </div>

      {/* Validation Warnings - Only show for admin */}
      {userRole === 'admin' && validationErrors.length > 0 && (
        <Card className='border-yellow-200 bg-yellow-50'>
          <CardContent className='pt-4'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='w-5 h-5 text-yellow-600 mt-0.5' />
              <div>
                <h4 className='font-medium text-yellow-800'>Data Validation Warnings</h4>
                <ul className='mt-2 text-sm text-yellow-700 space-y-1'>
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission Notice */}
      {!permissions.canView && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='pt-4'>
            <div className='flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5 text-red-600' />
              <p className='text-red-800'>
                You do not have permission to view milestones for this project.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {milestones.length === 0 ? (
        <EmptyState
          icon={<Calendar className='w-10 h-10 text-muted-foreground' />}
          title='No Milestones Yet'
          description='Create your first milestone to track project progress and important deadlines.'
          actionLabel='Add First Milestone'
          onAction={handleAddMilestone}
        />
      ) : (
        /* Milestones Timeline - Responsive */
        <div className='space-y-4 sm:space-y-6'>
          {milestones.map((milestone, index) => (
            <Card key={milestone.id} className='hover:shadow-md transition-shadow'>
              <CardContent className='p-4 sm:p-6'>
                <div className='flex gap-3 sm:gap-4'>
                  {/* Timeline Icon */}
                  <div className='flex flex-col items-center flex-shrink-0'>
                    {milestone.status === 'completed' ? (
                      <CheckCircle className='w-5 h-5 sm:w-6 sm:h-6 text-green-600' />
                    ) : (
                      <Circle className='w-5 h-5 sm:w-6 sm:h-6 text-gray-400' />
                    )}
                    {index < milestones.length - 1 && (
                      <div className='w-px h-12 sm:h-16 bg-border mt-2' />
                    )}
                  </div>

                  <div className='flex-1 min-w-0 space-y-3 sm:space-y-4'>
                    {/* Milestone Header - Responsive */}
                    <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
                      <div className='min-w-0'>
                        <h4 className='font-semibold text-base sm:text-lg'>{milestone.title}</h4>
                        {milestone.description && (
                          <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      <div className='flex items-center gap-2 flex-shrink-0'>
                        <Badge className={`${getStatusColor(milestone.status)} text-xs`}>
                          {getStatusDisplay(milestone.status)}
                        </Badge>
                        {permissions.canEdit && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEditMilestone(milestone)}
                            className='h-7 w-7 sm:h-8 sm:w-8 p-0'
                            title='Edit milestone'
                          >
                            <Edit className='w-3 h-3 sm:w-4 sm:h-4' />
                          </Button>
                        )}
                        {permissions.canDelete && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteMilestone(milestone)}
                            className='h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive'
                            title='Delete milestone'
                          >
                            <Trash className='w-3 h-3 sm:w-4 sm:h-4' />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Milestone Details Grid - Responsive */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0' />
                        <span className='text-muted-foreground'>Due:</span>
                        <span
                          className={
                            isOverdue(milestone.dueDate, milestone.status)
                              ? 'text-red-600 font-medium'
                              : 'font-medium'
                          }
                        >
                          {formatDate(milestone.dueDate)}
                        </span>
                      </div>

                      {milestone.status === 'completed' && milestone.updatedAt && (
                        <div className='flex items-center gap-2'>
                          <CheckCircle className='w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0' />
                          <span className='text-muted-foreground'>Completed:</span>
                          <span className='text-green-600 font-medium'>
                            {formatDate(milestone.updatedAt)}
                          </span>
                        </div>
                      )}

                      {(() => {
                        const progressData = getMilestoneProgress(milestone, projectTasks)
                        return (
                          <div className='flex items-center gap-2'>
                            <span className='text-muted-foreground'>Progress:</span>
                            <span className='font-medium'>
                              {progressData.completedTasksCount}/{progressData.relatedTasksCount}{' '}
                              tasks ({progressData.progress}%)
                            </span>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Progress Bar */}
                    {(() => {
                      const progressData = getMilestoneProgress(milestone, projectTasks)
                      return (
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-primary h-2 rounded-full transition-all duration-300'
                            style={{ width: `${progressData.progress}%` }}
                          />
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {project && (
        <AddMilestoneDialog
          isOpen={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          projectId={projectId}
          onMilestoneAdded={handleMilestoneChange}
        />
      )}

      {selectedMilestone && project && (
        <>
          <EditMilestoneDialog
            isOpen={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false)
              setSelectedMilestone(null)
            }}
            projectId={projectId}
            milestone={selectedMilestone}
            onMilestoneUpdated={handleMilestoneChange}
          />

          <DeleteMilestoneDialog
            isOpen={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false)
              setSelectedMilestone(null)
            }}
            projectId={projectId}
            milestone={selectedMilestone}
            onMilestoneDeleted={handleMilestoneChange}
          />
        </>
      )}
    </div>
  )
}
