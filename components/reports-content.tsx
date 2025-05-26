"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/molecules/card";
import { useRouter } from "next/navigation";

export function ReportsContent() {
  const { user, userRole } = useAuth();
  const router = useRouter();

  // Ensure only admins can access this page
  useEffect(() => {
    if (userRole !== "admin") {
      router.push("/dashboard");
    }
  }, [userRole, router]);

  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          View and generate reports for your organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>
            View key metrics and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center text-muted-foreground">
            Reports dashboard is under development. Check back soon!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
