"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import {
  getTasks,
  getProjects,
  type Task,
  type Project,
  type UserData,
} from "@/lib/firestore";
import {
  Timestamp,
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

interface TasksContextType {
  tasks: Task[];
  projects: Project[];
  users: UserData[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextType | null>(null);

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const { user, userRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches tasks, projects and users data from Firestore
   */
  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch tasks based on user role
      const [tasksData, projectsData] = await Promise.all([
        getTasks(userRole === "user" ? user.uid : undefined),
        getProjects(),
      ]);

      setTasks(tasksData);
      setProjects(projectsData);

      // For admin, fetch all users
      if (userRole === "admin") {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as UserData)
        );
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching tasks data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(
        `Failed to load tasks: ${errorMessage}. Please try again later.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, userRole]);

  /**
   * Completes a task
   * @param taskId - The ID of the task to complete
   */
  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        status: "completed",
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await fetchData(); // Refresh tasks
    } catch (error) {
      console.error("Error completing task:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to complete task: ${errorMessage}`);
    }
  };

  /**
   * Deletes a task
   * @param taskId - The ID of the task to delete
   */
  const handleDeleteTask = async (taskId: string) => {
    if (!user || userRole !== "admin") return;

    try {
      await deleteDoc(doc(db, "tasks", taskId));
      await fetchData(); // Refresh tasks
    } catch (error) {
      console.error("Error deleting task:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to delete task: ${errorMessage}`);
    }
  };

  // Create memoized value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({
      tasks,
      projects,
      users,
      loading,
      error,
      refreshTasks: fetchData,
      completeTask: handleCompleteTask,
      deleteTask: handleDeleteTask,
    }),
    [tasks, projects, users, loading, error]
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}
