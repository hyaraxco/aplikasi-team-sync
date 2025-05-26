"use client";

import type React from "react";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/atomics/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/molecules/card";
import { Input } from "@/components/atomics/input";
import { Label } from "@/components/atomics/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./atomics/Avatar.atomic";

export function SettingsContent() {
  const { userRole, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {userRole === "admin" && (
            <TabsTrigger value="system">System</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your public profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile}>
                <div className="space-y-6">
                  <div className="flex flex-col gap-6 sm:flex-row">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={user?.photoURL || ""}
                          alt={user?.email || ""}
                        />
                        <AvatarFallback className="text-lg">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <Button variant="outline" size="sm">
                          Change Avatar
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          JPG, GIF or PNG. 1MB max.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="grid gap-2.5">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={user?.displayName || ""} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue={user?.email || ""}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" />
                      </div>
                    </div>
                    <div className="grid gap-2.5">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" rows={4} />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePassword}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Preferences</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="language">Language</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred language
                  </p>
                </div>
                <Select defaultValue="en">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Time Zone</Label>
                  <p className="text-sm text-muted-foreground">
                    Set your local time zone
                  </p>
                </div>
                <Select defaultValue="utc-8">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="utc+0">UTC</SelectItem>
                    <SelectItem value="utc+1">
                      Central European Time (UTC+1)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="task-notifications">Task Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when tasks are assigned or updated
                  </p>
                </div>
                <Switch id="task-notifications" defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="project-notifications">Project Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about project changes
                  </p>
                </div>
                <Switch id="project-notifications" defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="payroll-notifications">
                    Payroll Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about payroll processing
                  </p>
                </div>
                <Switch id="payroll-notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === "admin" && (
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hourly-rate">Default Hourly Rate ($)</Label>
                    <Input id="hourly-rate" type="number" defaultValue="20" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="work-hours">
                      Standard Work Hours Per Day
                    </Label>
                    <Input id="work-hours" type="number" defaultValue="8" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payroll-day">Payroll Processing Day</Label>
                    <Select defaultValue="30">
                      <SelectTrigger id="payroll-day">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15th of month</SelectItem>
                        <SelectItem value="30">Last day of month</SelectItem>
                        <SelectItem value="both">
                          Both 15th and last day
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Security Settings</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor">
                        Two-Factor Authentication
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Require 2FA for all admin accounts
                      </p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="session-timeout">Session Timeout</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out inactive users
                      </p>
                    </div>
                    <Switch id="session-timeout" defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="ml-auto">Save System Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
