'use client'

import { Button } from '@/components/atomics/button'
import { Input } from '@/components/atomics/input'
import { Label } from '@/components/atomics/label'
import { Skeleton } from '@/components/atomics/skeleton'
import { Textarea } from '@/components/atomics/textarea'
import { useAuth } from '@/components/auth-provider'
import { DatePicker } from '@/components/molecules/AntDatePicker'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/molecules/command'
import { EmptyState } from '@/components/molecules/data-display/EmptyState'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/molecules/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/molecules/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/molecules/select'
import { PageHeader } from '@/components/organisms/PageHeader'
import { useToast } from '@/hooks'
import {
  approveTask,
  getProjects,
  getTasks,
  getUsers,
  requestTaskRevision,
  submitTaskForReview,
} from '@/lib/database'
import { db } from '@/lib/firebase'
import { cn, formatRupiah } from '@/lib/ui'
import type { Task as FirebaseTask, Project } from '@/types'
import { DragDropContext } from '@hello-pangea/dnd'
import { addDoc, collection, doc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore'
import { Check, CirclePlus, LayoutGrid, List, Loader2, UserPlus } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { SidebarDetailTasks } from './SidebarDetailTasks.section'
import type { TaskCardProps } from './TaskCard.section'
import TaskFilterBar from './TaskFilterBar.section'
import TaskList from './TaskList.Section'
import TaskListView from './TaskListView.section'

export function TasksContent() {
  const { user, userRole } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<Date>()
  const [tasks, setTasks] = useState<{
    backlog: TaskCardProps[]
    inProgress: TaskCardProps[]
    completed: TaskCardProps[]
    done: TaskCardProps[]
  }>({
    backlog: [],
    inProgress: [],
    completed: [],
    done: [],
  })
  const [allTasks, setAllTasks] = useState<TaskCardProps[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskCardProps | null>(null)
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false)

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState('Medium')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskStatus, setTaskStatus] = useState<string>('backlog')
  const [projects, setProjects] = useState<Project[]>([])
  const [taskProject, setTaskProject] = useState<string>('')
  const [taskRate, setTaskRate] = useState<number>(0)

  const [filters, setFilters] = useState({
    priority: [] as string[],
    status: [] as string[],
  })

  const [sortField, setSortField] = useState('dueDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [allMilestones, setAllMilestones] = useState<any[]>([])

  // Get milestone that this task contributes to
  const getTaskMilestone = (task: FirebaseTask, milestones: any[]) => {
    if (!milestones.length || !task.deadline) return null

    const taskDeadline = task.deadline.toDate()

    // Find milestones that this task contributes to (task deadline <= milestone due date)
    const contributingMilestones = milestones.filter((milestone: any) => {
      const milestoneDate = milestone.dueDate.toDate()
      return taskDeadline <= milestoneDate
    })

    // Return the earliest milestone this task contributes to
    if (contributingMilestones.length > 0) {
      return contributingMilestones.sort(
        (a: any, b: any) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime()
      )[0]
    }

    return null
  }

  // Map Firestore Task to TaskCardProps for TaskList
  const mapTaskToCard = (task: FirebaseTask, usersData: any[]): TaskCardProps => {
    let assigneeData = null
    let assigneeName = 'Unassigned'

    if (task.assignedTo && task.assignedTo.length > 0) {
      if (userRole === 'admin') {
        // For admin, look up assignee in usersData
        assigneeData = usersData.find(u => u.id === task.assignedTo?.[0])
        assigneeName = assigneeData?.displayName || 'Unassigned'
      } else {
        // For employee, check if current user is assigned to this task
        if (user?.uid && task.assignedTo.includes(user.uid)) {
          assigneeName = user?.displayName || user?.email || 'You'
          assigneeData = {
            id: user?.uid,
            displayName: assigneeName,
            email: user?.email,
            avatar: user?.photoURL,
          }
        } else {
          // Task is assigned to someone else, employee shouldn't see it
          // But if they do see it, show as assigned to someone else
          assigneeName = 'Other User'
        }
      }
    }

    // Get milestone for this task
    const taskMilestone = getTaskMilestone(task, allMilestones)

    return {
      id: task.id,
      name: task.name,
      description: task.description || '',
      priority: task.priority || 'Medium',
      status: task.status,
      dueDate: task.deadline ? task.deadline.toDate() : new Date(),
      assignee: {
        name: assigneeName,
        avatar: assigneeData?.photoURL || '/placeholder.svg?height=32&width=32',
        initials:
          assigneeName
            .split(' ')
            .map((n: string) => n[0])
            .join('') || 'UN',
      },
      milestone: taskMilestone
        ? {
            id: taskMilestone.id,
            title: taskMilestone.title,
            dueDate: taskMilestone.dueDate.toDate(),
          }
        : undefined,
      approvalStatus:
        task.status === 'completed'
          ? 'pending'
          : task.status === 'done'
            ? 'approved'
            : task.status === 'revision'
              ? 'rejected'
              : undefined,
      attachments: task.attachments || [],
      employeeComment: (task as any).employeeComment,
      reviewComment: (task as any).reviewComment,
    }
  }

  useEffect(() => {
    async function fetchData() {
      if (!user) return
      try {
        setLoading(true)
        setError(null)
        // Fetch all tasks from BE, no filtering, use getTasks
        const tasksData = await getTasks(
          userRole === 'employee' ? user.uid : undefined,
          undefined,
          userRole ?? undefined
        )

        // For admin, get all users. For employee, we only need current user data
        const usersData = userRole === 'admin' ? await getUsers() : []
        const projectsData = await getProjects(
          userRole === 'employee' ? user.uid : undefined,
          userRole ?? undefined
        )

        // Fetch all milestones from all projects
        const allMilestonesData: any[] = []
        for (const project of projectsData) {
          if (project.milestones && project.milestones.length > 0) {
            allMilestonesData.push(...project.milestones)
          }
        }
        setAllMilestones(allMilestonesData)

        // Use the mapTaskToCard function defined outside
        const mappedTasks = tasksData.map(task => mapTaskToCard(task, usersData))
        setAllTasks(mappedTasks)
        setUsers(usersData)
        setProjects(projectsData)
      } catch (error) {
        console.error('Error fetching tasks data:', error)
        setError('Failed to load tasks. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, userRole])

  const handleDragEnd = async (result: any) => {
    if (!user) return
    const { destination, source, draggableId } = result
    if (
      !destination ||
      (destination.droppableId === source.droppableId && destination.index === source.index)
    )
      return

    // Admin cannot use drag & drop - only view details and approve/reject
    if (userRole === 'admin') {
      toast({
        title: 'Action Not Allowed',
        description: 'Admins manage tasks via the detail sidebar, not drag-and-drop.',
        variant: 'destructive',
      })
      return
    }

    const sourceCol = source.droppableId
    const destCol = destination.droppableId

    // Find the task to move from allTasks
    const taskToMove = allTasks.find((task: TaskCardProps) => task.id === draggableId)
    if (!taskToMove) {
      toast({
        title: 'Error',
        description: 'Task not found.',
        variant: 'destructive',
      })
      return
    }

    // Role-based drag and drop restrictions
    if (userRole === 'employee') {
      // Employee restrictions

      // 1. Cannot drag tasks with "completed" status (pending admin review)
      if (taskToMove.status === 'completed') {
        toast({
          title: 'Action Not Allowed',
          description: 'Tasks pending review cannot be moved. Please wait for admin approval.',
          variant: 'destructive',
        })
        return
      }

      // 2. Cannot drag tasks with "done" status (already approved)
      if (taskToMove.status === 'done') {
        toast({
          title: 'Action Not Allowed',
          description: 'Approved tasks cannot be moved. Task is already completed.',
          variant: 'destructive',
        })
        return
      }

      // 3. Cannot directly move tasks to "Done" status
      if (destCol === 'done') {
        toast({
          title: 'Action Not Allowed',
          description: 'Only admins can approve tasks to Done status.',
          variant: 'destructive',
        })
        return
      }

      // 4. Define allowed moves for employees
      const allowedMoves: Record<string, string[]> = {
        backlog: ['inProgress'],
        inProgress: ['completed'], // Submits for admin review
        done: ['inProgress'], // Only for rejected/revision tasks
      }

      // 5. Special handling for done column - only allow moving rejected/revision tasks
      if (sourceCol === 'done') {
        if (taskToMove.status !== 'rejected' && taskToMove.status !== 'revision') {
          toast({
            title: 'Invalid Move',
            description: 'Only rejected or revision tasks can be moved from the Done column.',
            variant: 'destructive',
          })
          return
        }
      }

      // 6. Check if the move is allowed
      if (!allowedMoves[sourceCol] || !allowedMoves[sourceCol].includes(destCol)) {
        toast({
          title: 'Invalid Move',
          description: 'You cannot move the task to this column.',
          variant: 'destructive',
        })
        return
      }
    }
    // Admin has no restrictions - can drag any task to any column

    // Optimistically update the task status in allTasks for immediate UI feedback
    const updatedAllTasks = allTasks.map(task =>
      task.id === draggableId
        ? { ...task, status: destCol === 'inProgress' ? 'in_progress' : destCol }
        : task
    )
    setAllTasks(updatedAllTasks)
    setLoading(true)

    try {
      // Mapping kolom ke status Firestore
      const statusMap: Record<string, string> = {
        backlog: 'backlog',
        inProgress: 'in_progress',
        completed: 'completed',
        revision: 'revision',
        done: 'done',
        rejected: 'rejected',
      }
      const newStatus = statusMap[destCol]

      if (destCol === 'completed') {
        await submitTaskForReview(taskToMove.id, user.uid)
        toast({ title: 'Task Submitted for Review' })
      } else if (sourceCol === 'done' && destCol === 'inProgress') {
        // Moving rejected task back to in progress
        await updateDoc(doc(db, 'tasks', taskToMove.id), {
          status: 'in_progress',
          updatedAt: serverTimestamp(),
        })
        toast({ title: 'Task moved back to In Progress' })
      } else if (newStatus) {
        // Update task status directly - Firestore rules now allow this for assigned employees
        await updateDoc(doc(db, 'tasks', taskToMove.id), {
          status: newStatus,
          updatedAt: serverTimestamp(),
        })
        toast({ title: 'Task Updated' })
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      // Revert the optimistic update
      setAllTasks(allTasks)
      toast({
        title: 'Error',
        description: 'Failed to update task. Reverting changes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = (task: TaskCardProps) => {
    setSelectedTask(task)
    setIsDetailSidebarOpen(true)
  }

  const handleFilterChange = (type: 'priority' | 'status', value: string) => {
    setFilters((prev: typeof filters) => {
      const newFilters = { ...prev }
      if (newFilters[type].includes(value)) {
        newFilters[type] = newFilters[type].filter((item: string) => item !== value)
      } else {
        newFilters[type] = [...newFilters[type], value]
      }
      return newFilters
    })
  }

  const clearFilters = () => {
    setFilters({
      priority: [],
      status: [],
    })
    setSearchTerm('')
  }

  const applyFiltersAndSearch = () => {
    let filtered = allTasks
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        task =>
          task.name.toLowerCase().includes(term) ||
          (task.description && task.description.toLowerCase().includes(term))
      )
    }
    if (filters.priority.length > 0)
      filtered = filtered.filter(task => filters.priority.includes(task.priority))
    if (filters.status.length > 0)
      filtered = filtered.filter(task => filters.status.includes(task.status))
    filtered.sort((a, b) => {
      if (sortField === 'dueDate') {
        return sortDirection === 'asc'
          ? a.dueDate.getTime() - b.dueDate.getTime()
          : b.dueDate.getTime() - a.dueDate.getTime()
      }
      if (sortField === 'priority') {
        const priorityValues = { High: 3, Medium: 2, Low: 1 }
        return sortDirection === 'asc'
          ? priorityValues[a.priority as keyof typeof priorityValues] -
              priorityValues[b.priority as keyof typeof priorityValues]
          : priorityValues[b.priority as keyof typeof priorityValues] -
              priorityValues[a.priority as keyof typeof priorityValues]
      }
      if (sortField === 'name') {
        return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }
      return 0
    })
    return {
      backlog: filtered.filter(task => task.status === 'backlog'),
      inProgress: filtered.filter(task => task.status === 'in_progress'),
      completed: filtered.filter(task => task.status === 'completed'),
      done: filtered.filter(
        task => task.status === 'done' || task.status === 'rejected' || task.status === 'revision'
      ), // Consolidated: revision and rejected both appear in done column
    }
  }

  const filteredTasks = applyFiltersAndSearch()

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!taskTitle.trim() || !taskProject) {
      toast({
        title: 'Error',
        description: 'Title and project are required.',
        variant: 'destructive',
      })
      return
    }
    setIsDialogOpen(false)
    setIsSubmittingTask(true)
    setLoading(true)
    try {
      const taskData = {
        name: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        deadline: date ? Timestamp.fromDate(date) : Timestamp.fromDate(new Date()),
        status: taskStatus,
        projectId: taskProject,
        taskRate: taskRate,
        assignedTo:
          userRole === 'admin' && taskAssignee ? [taskAssignee] : user.uid ? [user.uid] : [],
        createdBy: user.uid,
        // Milestone will be automatically assigned based on deadline
      }
      const taskRef = await addDoc(collection(db, 'tasks'), {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      const assigneeData =
        userRole === 'admin' && taskAssignee
          ? users.find(u => u.id === taskAssignee)
          : users.find(u => u.id === user.uid)
      const assigneeName = assigneeData?.displayName || 'Unassigned'

      const newTask: TaskCardProps = {
        id: taskRef.id,
        name: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        status: 'backlog',
        dueDate: date || new Date(),
        assignee: {
          name: assigneeName,
          avatar: assigneeData?.photoURL || '/placeholder.svg?height=32&width=32',
          initials:
            assigneeName
              .split(' ')
              .map((n: string) => n[0])
              .join('') || 'UN',
        },
        attachments: [],
      }

      setTasks(prev => ({ ...prev, backlog: [...prev.backlog, newTask] }))
      setAllTasks(prev => [...prev, newTask])

      setTaskTitle('')
      setTaskDescription('')
      setTaskPriority('Medium')
      setTaskAssignee('')
      setDate(undefined)
      setTaskStatus('backlog')

      setTaskProject('')
      setTaskRate(0)
      toast({ title: 'Success', description: 'Task created successfully' })
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingTask(false)
      setLoading(false)
    }
  }

  const handleUpdateTask = async (status: 'done' | 'revision', comment?: string) => {
    if (!selectedTask || !user) return
    try {
      if (status === 'done') {
        await approveTask(selectedTask.id, user.uid)
      } else {
        await requestTaskRevision(selectedTask.id, user.uid, comment)
      }

      // Update allTasks with the new status for immediate UI feedback
      const updatedAllTasks = allTasks.map(task =>
        task.id === selectedTask.id
          ? {
              ...task,
              status: status === 'done' ? 'done' : 'revision',
              approvalStatus: (status === 'done' ? 'approved' : 'rejected') as
                | 'approved'
                | 'rejected',
            }
          : task
      )
      setAllTasks(updatedAllTasks)

      toast({
        title: status === 'done' ? 'Task Approved' : 'Revision Requested',
      })
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: 'Error',
        description: 'Failed to update task.',
        variant: 'destructive',
      })
    }
  }

  // Function to refresh data from Firestore
  const refreshTaskData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const tasksData = await getTasks(
        userRole === 'employee' ? user.uid : undefined,
        undefined,
        userRole ?? undefined
      )
      const usersData = await getUsers()
      const mappedTasks = tasksData.map(task => mapTaskToCard(task, usersData))
      setAllTasks(mappedTasks)
      setUsers(usersData)
    } catch (error) {
      console.error('Error refreshing task data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <PageHeader
        title='Tasks'
        description={
          userRole === 'admin'
            ? 'Manage and track all tasks'
            : 'View and complete your assigned tasks'
        }
        actionLabel={userRole === 'admin' ? 'Create Task' : undefined}
        onAction={userRole === 'admin' ? () => setIsDialogOpen(true) : undefined}
        icon={<CirclePlus className='h-4 w-4' />}
      />

      <TaskFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortFieldChange={setSortField}
        onSortDirectionChange={setSortDirection}
        onClearFilters={clearFilters}
      />

      {/* View Mode Toggle */}
      <div className='flex items-center justify-end gap-2'>
        <span className='text-sm text-muted-foreground'>Mode: </span>
        <div className='flex items-center border rounded-lg p-1 gap-1'>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setViewMode('kanban')}
            className='h-8 px-3'
          >
            <LayoutGrid className='w-4 h-4 mr-1' />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setViewMode('list')}
            className='h-8 px-3'
          >
            <List className='w-4 h-4 mr-1' />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className='space-y-2 p-4'>
                <Skeleton className='h-6 w-1/3 mb-2' />
                <Skeleton className='h-5 w-2/3 mb-2' />
                <Skeleton className='h-4 w-full mb-2' />
                <Skeleton className='h-8 w-full mb-2' />
                <Skeleton className='h-6 w-1/2' />
              </div>
            ))}
        </div>
      ) : filteredTasks.backlog.length +
          filteredTasks.inProgress.length +
          filteredTasks.completed.length +
          filteredTasks.done.length ===
        0 ? (
        <div className='flex flex-col items-center justify-center h-[60vh]'>
          <EmptyState
            icon={<Loader2 className='w-10 h-10 text-muted-foreground' />}
            title='No tasks found'
            description={
              searchTerm || filters.priority.length > 0 || filters.status.length > 0
                ? 'Try adjusting your filters or search term'
                : userRole === 'admin'
                  ? 'Create a task to get started'
                  : 'You have no tasks yet'
            }
          />
        </div>
      ) : viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {userRole === 'admin' ? (
              <>
                <TaskList
                  title='Backlog'
                  tasks={filteredTasks.backlog}
                  onTaskClick={handleTaskClick}
                  droppableId='backlog'
                  enableDragDrop={false}
                  userRole={userRole || 'employee'}
                />
                <TaskList
                  title='In Progress'
                  tasks={filteredTasks.inProgress}
                  onTaskClick={handleTaskClick}
                  droppableId='inProgress'
                  enableDragDrop={false}
                  userRole={userRole || 'employee'}
                />
                <TaskList
                  title='Completed'
                  tasks={filteredTasks.completed}
                  onTaskClick={handleTaskClick}
                  droppableId='completed'
                  enableDragDrop={false}
                  userRole={userRole || 'employee'}
                />
                <TaskList
                  title='Done'
                  tasks={filteredTasks.done}
                  onTaskClick={handleTaskClick}
                  droppableId='done'
                  enableDragDrop={false}
                  userRole={userRole || 'employee'}
                />
              </>
            ) : (
              <>
                <TaskList
                  title='Backlog'
                  tasks={filteredTasks.backlog}
                  onTaskClick={handleTaskClick}
                  droppableId='backlog'
                  enableDragDrop={true}
                  userRole={userRole || 'employee'}
                />
                <TaskList
                  title='In Progress'
                  tasks={filteredTasks.inProgress}
                  onTaskClick={handleTaskClick}
                  droppableId='inProgress'
                  enableDragDrop={true}
                  userRole={userRole || 'employee'}
                />
                <TaskList
                  title='Completed'
                  tasks={filteredTasks.completed}
                  onTaskClick={handleTaskClick}
                  droppableId='completed'
                  enableDragDrop={true}
                  userRole={userRole || 'employee'}
                />
                <TaskList
                  title='Done'
                  tasks={filteredTasks.done}
                  onTaskClick={handleTaskClick}
                  droppableId='done'
                  enableDragDrop={true}
                  userRole={userRole || 'employee'}
                />
              </>
            )}
          </div>
        </DragDropContext>
      ) : (
        <TaskListView
          tasks={[
            ...filteredTasks.backlog,
            ...filteredTasks.inProgress,
            ...filteredTasks.completed,
            ...filteredTasks.done,
          ]}
          onTaskClick={handleTaskClick}
          userRole={userRole || 'employee'}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>Create a new task and assign it to a team member.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask}>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='title'>Title</Label>
                <Input
                  id='title'
                  name='title'
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  required
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  name='description'
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='project'>Project</Label>
                <Select name='project' value={taskProject} onValueChange={setTaskProject}>
                  <SelectTrigger id='project'>
                    <SelectValue placeholder='Select project' />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='priority'>Priority</Label>
                  <Select name='priority' value={taskPriority} onValueChange={setTaskPriority}>
                    <SelectTrigger id='priority'>
                      <SelectValue placeholder='Select priority' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='High'>High</SelectItem>
                      <SelectItem value='Medium'>Medium</SelectItem>
                      <SelectItem value='Low'>Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <Label>Deadline</Label>
                  <DatePicker
                    value={date ?? null}
                    onChange={d => setDate(d ?? undefined)}
                    placeholder='Select date'
                    className='w-full'
                  />
                </div>
              </div>

              {/* Milestone Assignment Info */}
              {taskProject && (
                <div className='grid gap-2'>
                  <p className='text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200'>
                    📍 <strong>Automatic Milestone Assignment:</strong> This task will automatically
                    contribute to the earliest milestone whose due date is on or after the task's
                    deadline.
                  </p>
                </div>
              )}

              <div className='grid gap-2'>
                <Label htmlFor='taskRate'>Task Rate (Rp)</Label>
                <Input
                  id='taskRate'
                  type='text'
                  value={formatRupiah(taskRate, { withSymbol: false })}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '')
                    setTaskRate(Number(raw))
                  }}
                  required
                />
              </div>
              {userRole === 'admin' && (
                <div className='grid gap-2'>
                  <Label>Assign To</Label>
                  <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        role='combobox'
                        aria-expanded={assigneePopoverOpen}
                        className={cn(
                          'w-full justify-between',
                          !taskAssignee && 'text-muted-foreground'
                        )}
                      >
                        {taskAssignee
                          ? users.find(u => u.id === taskAssignee)?.displayName ||
                            users.find(u => u.id === taskAssignee)?.email
                          : 'Select assignee'}
                        <UserPlus className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0'>
                      <Command>
                        <CommandInput placeholder='Search user...' />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            {users
                              .filter(u => u.status === 'active')
                              .map(u => (
                                <CommandItem
                                  key={u.id}
                                  value={u.displayName || u.email || u.id}
                                  onSelect={() => {
                                    setTaskAssignee(u.id)
                                    setAssigneePopoverOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      u.id === taskAssignee ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {u.displayName || u.email}
                                  <span className='text-xs text-muted-foreground ml-1'>
                                    ({u.position})
                                  </span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            <DialogFooter>
              {isSubmittingTask ? (
                <Button disabled>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Creating...
                </Button>
              ) : (
                <Button type='submit'>Add Task</Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SidebarDetailTasks
        task={selectedTask}
        isOpen={isDetailSidebarOpen}
        userRole={userRole}
        onOpenChange={setIsDetailSidebarOpen}
        onDataRefresh={refreshTaskData}
      />

      {error && (
        <div className='mb-2'>
          <EmptyState
            icon={<Loader2 className='w-8 h-8 text-muted-foreground animate-spin' />}
            title='Failed to load tasks'
            description={error}
          />
        </div>
      )}
    </div>
  )
}
