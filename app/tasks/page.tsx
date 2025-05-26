"use client";

import { TasksContent } from "@/components/tasks-content";
import { DashboardLayout } from "../dashboard/section/dashboard-layout";

export default function TasksPage() {
  return (
    <DashboardLayout>
      <TasksContent />
    </DashboardLayout>
  );
}
