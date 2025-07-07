"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/atomics/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atomics/popover";
import { CirclePlus, UserPlus, Check, Loader2 } from "lucide-react";
import { DatePicker } from "@/components/molecules/AntDatePicker";
import { DragDropContext } from "@hello-pangea/dnd";
import { useToast } from "@/hooks";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/molecules/command";
import { PageHeader } from "@/components/common/layout/PageHeader";
import TaskFilterBar from "./TaskFilterBar.section";
import { SidebarDetailTasks } from "./SidebarDetailTasks.section";
import {
  cn,
  getTasks,
  getUsers,
  getProjects,
  submitTaskForReview,
  approveTask,
  requestTaskRevision,
  Timestamp,
  type Task as FirebaseTask,
  type Project,
} from "@/lib/helpers";
import {
  collection,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import TaskList from "./TaskList.Section";
import { Badge } from "@/components/ui/badge";
import type { TaskCardProps } from "./TaskCard.section";
import { formatRupiah } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/data-display/EmptyState";

export function TasksContent() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<Date>();
  const [tasks, setTasks] = useState<{
    backlog: TaskCardProps[];
    inProgress: TaskCardProps[];
    completed: TaskCardProps[];
    revision: TaskCardProps[];
    done: TaskCardProps[];
    rejected: TaskCardProps[];
  }>({
    backlog: [],
    inProgress: [],
    completed: [],
    revision: [],
    done: [],
    rejected: [],
  });
  const [allTasks, setAllTasks] = useState<TaskCardProps[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskCardProps | null>(null);
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskStatus, setTaskStatus] = useState<string>("backlog");
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskProject, setTaskProject] = useState<string>("");
  const [taskRate, setTaskRate] = useState<number>(0);

  const [filters, setFilters] = useState({
    priority: [] as string[],
    status: [] as string[],
  });

  const [sortField, setSortField] = useState("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        // Fetch all tasks from BE, no filtering, use getTasks
        const tasksData = await getTasks(
          userRole === "employee" ? user.uid : undefined,
          undefined,
          userRole ?? undefined
        );
        const usersData = userRole === "admin" ? await getUsers() : [];
        const projectsData = await getProjects(
          userRole === "employee" ? user.uid : undefined,
          userRole ?? undefined
        );

        // Map Firestore Task to TaskCardProps for TaskList
        const mapTaskToCard = (
          task: FirebaseTask,
          usersData: any[]
        ): TaskCardProps => {
          const assigneeData =
            task.assignedTo && task.assignedTo.length > 0
              ? usersData.find((u) => u.id === task.assignedTo?.[0])
              : null;
          const assigneeName = assigneeData?.displayName || "Unassigned";
          return {
            id: task.id,
            name: task.name,
            description: task.description || "",
            priority: task.priority || "Medium",
            status: task.status,
            dueDate: task.deadline ? task.deadline.toDate() : new Date(),
            assignee: {
              name: assigneeName,
              avatar:
                assigneeData?.photoURL || "/placeholder.svg?height=32&width=32",
              initials:
                assigneeName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("") || "UN",
            },
            approvalStatus:
              task.status === "completed"
                ? "pending"
                : task.status === "done"
                  ? "approved"
                  : task.status === "revision"
                    ? "rejected"
                    : undefined,
          };
        };
        const mappedTasks = tasksData.map((task) =>
          mapTaskToCard(task, usersData)
        );
        setAllTasks(mappedTasks);
        setUsers(usersData);
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching tasks data:", error);
        setError("Failed to load tasks. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, userRole]);

  const handleDragEnd = async (result: any) => {
    if (!user) return;
    const { destination, source, draggableId } = result;
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    )
      return;

    // Only allow drag & drop for employee
    if (userRole === "admin") {
      toast({
        title: "Action Not Allowed",
        description:
          "Admins manage tasks via the detail sidebar, not drag-and-drop.",
        variant: "destructive",
      });
      return;
    }

    // Employee allowed moves
    const allowedMoves: Record<string, string[]> = {
      backlog: ["inProgress"],
      inProgress: ["completed"],
      revision: ["inProgress"],
      rejected: ["inProgress"],
    };
    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    if (
      !allowedMoves[sourceCol] ||
      !allowedMoves[sourceCol].includes(destCol)
    ) {
      toast({
        title: "Invalid Move",
        description: "You cannot move the task to this column.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const originalTasks = JSON.parse(JSON.stringify(tasks));
    const newTasks = { ...tasks };
    const sourceColumn = newTasks[sourceCol as keyof typeof newTasks];
    const taskToMove = sourceColumn.find(
      (task: TaskCardProps) => task.id === draggableId
    );
    if (!taskToMove) {
      setLoading(false);
      return;
    }
    sourceColumn.splice(source.index, 1);
    newTasks[destCol as keyof typeof tasks].splice(
      destination.index,
      0,
      taskToMove
    );
    setTasks(newTasks);

    try {
      // Mapping kolom ke status Firestore
      const statusMap: Record<string, string> = {
        backlog: "backlog",
        inProgress: "in_progress",
        completed: "completed",
        revision: "revision",
        done: "done",
        rejected: "rejected",
      };
      const newStatus = statusMap[destCol];

      if (destCol === "completed") {
        await submitTaskForReview(taskToMove.id, user.uid);
        toast({ title: "Task Submitted for Review" });
      } else if (newStatus) {
        await updateDoc(doc(db, "tasks", taskToMove.id), {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Task Updated" });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      setTasks(originalTasks);
      toast({
        title: "Error",
        description: "Failed to update task. Reverting changes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: TaskCardProps) => {
    setSelectedTask(task);
    setIsDetailSidebarOpen(true);
  };

  const handleFilterChange = (type: "priority" | "status", value: string) => {
    setFilters((prev: typeof filters) => {
      const newFilters = { ...prev };
      if (newFilters[type].includes(value)) {
        newFilters[type] = newFilters[type].filter(
          (item: string) => item !== value
        );
      } else {
        newFilters[type] = [...newFilters[type], value];
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      priority: [],
      status: [],
    });
    setSearchTerm("");
  };

  const applyFiltersAndSearch = () => {
    let filtered = allTasks;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(term) ||
          (task.description && task.description.toLowerCase().includes(term))
      );
    }
    if (filters.priority.length > 0)
      filtered = filtered.filter((task) =>
        filters.priority.includes(task.priority)
      );
    if (filters.status.length > 0)
      filtered = filtered.filter((task) =>
        filters.status.includes(task.status)
      );
    filtered.sort((a, b) => {
      if (sortField === "dueDate") {
        return sortDirection === "asc"
          ? a.dueDate.getTime() - b.dueDate.getTime()
          : b.dueDate.getTime() - a.dueDate.getTime();
      }
      if (sortField === "priority") {
        const priorityValues = { High: 3, Medium: 2, Low: 1 };
        return sortDirection === "asc"
          ? priorityValues[a.priority as keyof typeof priorityValues] -
              priorityValues[b.priority as keyof typeof priorityValues]
          : priorityValues[b.priority as keyof typeof priorityValues] -
              priorityValues[a.priority as keyof typeof priorityValues];
      }
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      return 0;
    });
    return {
      backlog: filtered.filter((task) => task.status === "backlog"),
      inProgress: filtered.filter((task) => task.status === "in_progress"),
      completed: filtered.filter((task) => task.status === "completed"),
      done: filtered.filter((task) => task.status === "done"),
      rejected: filtered.filter((task) => task.status === "rejected"),
    };
  };

  const filteredTasks = applyFiltersAndSearch();

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!taskTitle.trim() || !taskProject) {
      toast({
        title: "Error",
        description: "Title and project are required.",
        variant: "destructive",
      });
      return;
    }
    setIsDialogOpen(false);
    setIsSubmittingTask(true);
    setLoading(true);
    try {
      const taskData = {
        name: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        deadline: date
          ? Timestamp.fromDate(date)
          : Timestamp.fromDate(new Date()),
        status: taskStatus,
        projectId: taskProject,
        taskRate: taskRate,
        assignedTo:
          userRole === "admin" && taskAssignee
            ? [taskAssignee]
            : user.uid
              ? [user.uid]
              : [],
        createdBy: user.uid,
      };
      const taskRef = await addDoc(collection(db, "tasks"), {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const assigneeData =
        userRole === "admin" && taskAssignee
          ? users.find((u) => u.id === taskAssignee)
          : users.find((u) => u.id === user.uid);
      const assigneeName = assigneeData?.displayName || "Unassigned";

      const newTask: TaskCardProps = {
        id: taskRef.id,
        name: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        status: "backlog",
        dueDate: date || new Date(),
        assignee: {
          name: assigneeName,
          avatar:
            assigneeData?.photoURL || "/placeholder.svg?height=32&width=32",
          initials:
            assigneeName
              .split(" ")
              .map((n: string) => n[0])
              .join("") || "UN",
        },
      };

      setTasks((prev) => ({ ...prev, backlog: [...prev.backlog, newTask] }));
      setAllTasks((prev) => [...prev, newTask]);

      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("Medium");
      setTaskAssignee("");
      setDate(undefined);
      setTaskStatus("backlog");
      setTaskProject("");
      setTaskRate(0);
      toast({ title: "Success", description: "Task created successfully" });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingTask(false);
      setLoading(false);
    }
  };

  const handleUpdateTask = async (
    status: "done" | "revision",
    comment?: string
  ) => {
    if (!selectedTask || !user) return;
    try {
      if (status === "done") {
        await approveTask(selectedTask.id, user.uid);
      } else {
        await requestTaskRevision(selectedTask.id, user.uid, comment);
      }
      const updatedTask: TaskCardProps = {
        ...selectedTask,
        status: status === "done" ? "Done" : "Revision",
        approvalStatus: status === "done" ? "approved" : "rejected",
      };
      const newTasks = { ...tasks };
      const oldStatusKey = Object.keys(newTasks).find((key) =>
        newTasks[key as keyof typeof tasks].some(
          (t) => t.id === selectedTask.id
        )
      ) as keyof typeof tasks | undefined;
      if (oldStatusKey) {
        newTasks[oldStatusKey] = newTasks[oldStatusKey].filter(
          (t) => t.id !== selectedTask.id
        );
      }
      const newStatusKey = status === "done" ? "done" : "revision";
      (newTasks[newStatusKey as keyof typeof tasks] as TaskCardProps[]).push(
        updatedTask
      );
      setTasks(newTasks);
      setIsDetailSidebarOpen(false);
      toast({
        title: status === "done" ? "Task Approved" : "Revision Requested",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tasks"
        description={
          userRole === "admin"
            ? "Manage and track all tasks"
            : "View and complete your assigned tasks"
        }
        actionLabel={userRole === "admin" ? "Create Task" : undefined}
        onAction={
          userRole === "admin" ? () => setIsDialogOpen(true) : undefined
        }
        icon={<CirclePlus className="h-4 w-4" />}
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="space-y-2 p-4">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ))}
        </div>
      ) : filteredTasks.backlog.length +
          filteredTasks.inProgress.length +
          filteredTasks.completed.length +
          filteredTasks.done.length +
          filteredTasks.rejected.length ===
        0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <EmptyState
            icon={<Loader2 className="w-10 h-10 text-muted-foreground" />}
            title="No tasks found"
            description={
              searchTerm ||
              filters.priority.length > 0 ||
              filters.status.length > 0
                ? "Try adjusting your filters or search term"
                : userRole === "admin"
                  ? "Create a task to get started"
                  : "You have no tasks yet"
            }
          />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {userRole === "admin" ? (
              <>
                <TaskList
                  title="Backlog"
                  tasks={filteredTasks.backlog}
                  onTaskClick={handleTaskClick}
                  droppableId="backlog"
                  enableDragDrop={false}
                />
                <TaskList
                  title="In Progress"
                  tasks={filteredTasks.inProgress}
                  onTaskClick={handleTaskClick}
                  droppableId="inProgress"
                  enableDragDrop={false}
                />
                <TaskList
                  title="Completed"
                  tasks={filteredTasks.completed}
                  onTaskClick={handleTaskClick}
                  droppableId="completed"
                  enableDragDrop={false}
                />
                <TaskList
                  title="Done"
                  tasks={filteredTasks.done}
                  onTaskClick={handleTaskClick}
                  droppableId="done"
                  enableDragDrop={false}
                />
                <TaskList
                  title="Rejected"
                  tasks={filteredTasks.rejected}
                  onTaskClick={handleTaskClick}
                  droppableId="rejected"
                  enableDragDrop={false}
                />
              </>
            ) : (
              <>
                <TaskList
                  title="Backlog"
                  tasks={filteredTasks.backlog}
                  onTaskClick={handleTaskClick}
                  droppableId="backlog"
                  enableDragDrop={userRole === "employee"}
                />
                <TaskList
                  title="In Progress"
                  tasks={filteredTasks.inProgress}
                  onTaskClick={handleTaskClick}
                  droppableId="inProgress"
                  enableDragDrop={userRole === "employee"}
                />
                <TaskList
                  title="Completed"
                  tasks={filteredTasks.completed}
                  onTaskClick={handleTaskClick}
                  droppableId="completed"
                  enableDragDrop={userRole === "employee"}
                />
                <TaskList
                  title="Done"
                  tasks={filteredTasks.done}
                  onTaskClick={handleTaskClick}
                  droppableId="done"
                  enableDragDrop={false}
                />
                <TaskList
                  title="Rejected"
                  tasks={filteredTasks.rejected}
                  onTaskClick={handleTaskClick}
                  droppableId="rejected"
                  enableDragDrop={userRole === "employee"}
                />
              </>
            )}
          </div>
        </DragDropContext>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to a team member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  name="project"
                  value={taskProject}
                  onValueChange={setTaskProject}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    name="priority"
                    value={taskPriority}
                    onValueChange={setTaskPriority}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Deadline</Label>
                  <DatePicker
                    value={date ?? null}
                    onChange={(d) => setDate(d ?? undefined)}
                    placeholder="Select date"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taskRate">Task Rate (Rp)</Label>
                <Input
                  id="taskRate"
                  type="text"
                  value={formatRupiah(taskRate, { withSymbol: false })}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    setTaskRate(Number(raw));
                  }}
                  required
                />
              </div>
              {userRole === "admin" && (
                <div className="grid gap-2">
                  <Label>Assign To</Label>
                  <Popover
                    open={assigneePopoverOpen}
                    onOpenChange={setAssigneePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={assigneePopoverOpen}
                        className={cn(
                          "w-full justify-between",
                          !taskAssignee && "text-muted-foreground"
                        )}
                      >
                        {taskAssignee
                          ? users.find((u) => u.id === taskAssignee)
                              ?.displayName ||
                            users.find((u) => u.id === taskAssignee)?.email
                          : "Select assignee"}
                        <UserPlus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                      <Command>
                        <CommandInput placeholder="Search user..." />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            {users
                              .filter((u) => u.status === "active")
                              .map((u) => (
                                <CommandItem
                                  key={u.id}
                                  value={u.displayName || u.email || u.id}
                                  onSelect={() => {
                                    setTaskAssignee(u.id);
                                    setAssigneePopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      u.id === taskAssignee
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {u.displayName || u.email}
                                  <span className="text-xs text-muted-foreground ml-1">
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </Button>
              ) : (
                <Button type="submit">Add Task</Button>
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
        onUpdateTask={handleUpdateTask}
      />

      {error && (
        <div className="mb-2">
          <EmptyState
            icon={
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            }
            title="Failed to load tasks"
            description={error}
          />
        </div>
      )}
    </div>
  );
}
