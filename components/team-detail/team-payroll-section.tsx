"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getUserData, getTasks, getAttendanceRecords, type TeamMember } from "@/lib/firestore"

interface TeamPayrollSectionProps {
  teamId: string
  members: TeamMember[]
}

interface MemberEarnings {
  userId: string
  displayName: string
  email: string
  taskEarnings: number
  attendanceEarnings: number
  totalEarnings: number
  hoursWorked: number
  completedTasks: number
}

export function TeamPayrollSection({ teamId, members }: TeamPayrollSectionProps) {
  const { user, userRole } = useAuth()
  const [loading, setLoading] = useState(true)
  const [memberEarnings, setMemberEarnings] = useState<MemberEarnings[]>([])
  const [period, setPeriod] = useState<string>(getCurrentMonthPeriod())
  const [totalTaskEarnings, setTotalTaskEarnings] = useState(0)
  const [totalAttendanceEarnings, setTotalAttendanceEarnings] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [totalCompletedTasks, setTotalCompletedTasks] = useState(0)
  const [totalHoursWorked, setTotalHoursWorked] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Helper function to get current month in format "YYYY-MM"
  function getCurrentMonthPeriod(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  }

  // Helper function to get month name from period
  function getMonthName(period: string): string {
    const [year, month] = period.split("-")
    return new Date(Number.parseInt(year), Number.parseInt(month) - 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    })
  }

  // Generate period options (last 12 months)
  function getPeriodOptions(): { value: string; label: string }[] {
    const options = []
    const now = new Date()

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const label = date.toLocaleString("default", { month: "long", year: "numeric" })
      options.push({ value, label })
    }

    return options
  }

  useEffect(() => {
    async function fetchPayrollData() {
      try {
        setLoading(true)
        setError(null)

        // Check if user is admin
        if (userRole !== "admin") {
          setError("You don't have permission to view payroll data")
          setLoading(false)
          return
        }

        // Parse period to get year and month
        const [year, month] = period.split("-").map(Number)
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0) // Last day of month

        // Fetch data for each team member
        const earningsPromises = members.map(async (member) => {
          // Get user data
          const userData = await getUserData(member.userId)
          if (!userData) return null

          // Get completed tasks for this period and team
          const tasks = await getTasks(member.userId)
          const periodTasks = tasks.filter((task) => {
            if (!task.completedAt) return false
            const completedDate = task.completedAt.toDate()
            return completedDate >= startDate && completedDate <= endDate && task.teamId === teamId // Ensure task is for this team
          })

          const taskEarnings = periodTasks.reduce((sum, task) => sum + (task.price || 0), 0)
          const completedTasks = periodTasks.length

          // Get attendance records for this period
          const attendanceRecords = await getAttendanceRecords(member.userId)
          const periodAttendance = attendanceRecords.filter((record) => {
            const recordDate = record.date.toDate()
            return recordDate >= startDate && recordDate <= endDate && record.teamId === teamId // Ensure attendance is for this team
          })

          const attendanceEarnings = periodAttendance.reduce((sum, record) => sum + (record.earnings || 0), 0)
          const hoursWorked = periodAttendance.reduce((sum, record) => sum + (record.hoursWorked || 0), 0)

          return {
            userId: member.userId,
            displayName: userData.displayName || "Unknown",
            email: userData.email,
            taskEarnings,
            attendanceEarnings,
            totalEarnings: taskEarnings + attendanceEarnings,
            hoursWorked,
            completedTasks,
          }
        })

        const earningsData = (await Promise.all(earningsPromises)).filter(Boolean) as MemberEarnings[]
        setMemberEarnings(earningsData)

        // Calculate totals
        const taskTotal = earningsData.reduce((sum, member) => sum + member.taskEarnings, 0)
        const attendanceTotal = earningsData.reduce((sum, member) => sum + member.attendanceEarnings, 0)
        const completedTasksTotal = earningsData.reduce((sum, member) => sum + member.completedTasks, 0)
        const hoursWorkedTotal = earningsData.reduce((sum, member) => sum + member.hoursWorked, 0)

        setTotalTaskEarnings(taskTotal)
        setTotalAttendanceEarnings(attendanceTotal)
        setTotalEarnings(taskTotal + attendanceTotal)
        setTotalCompletedTasks(completedTasksTotal)
        setTotalHoursWorked(hoursWorkedTotal)
      } catch (error) {
        console.error("Error fetching payroll data:", error)
        setError("Failed to load payroll data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPayrollData()
  }, [teamId, members, period, userRole])

  // If not admin, show access denied message
  if (userRole !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Payroll</CardTitle>
          <CardDescription>Earnings summary</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to view payroll information. Please contact an administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (error && error !== "You don't have permission to view payroll data") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Payroll</CardTitle>
          <CardDescription>Earnings summary</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Team Payroll</CardTitle>
          <CardDescription>Earnings summary for {getMonthName(period)}</CardDescription>
        </div>
        <div className="mt-4 md:mt-0 w-full md:w-48">
          <Label htmlFor="period" className="sr-only">
            Period
          </Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger id="period">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {getPeriodOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">Task Earnings</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">${totalTaskEarnings.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">Attendance Earnings</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">${totalAttendanceEarnings.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {totalCompletedTasks} tasks / {totalHoursWorked.toFixed(1)} hrs
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Earnings Table */}
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : memberEarnings.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Hours Worked</TableHead>
                  <TableHead>Tasks Completed</TableHead>
                  <TableHead>Task Earnings</TableHead>
                  <TableHead>Attendance Earnings</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberEarnings.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.displayName}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{member.hoursWorked.toFixed(1)}</TableCell>
                    <TableCell>{member.completedTasks}</TableCell>
                    <TableCell>${member.taskEarnings.toFixed(2)}</TableCell>
                    <TableCell>${member.attendanceEarnings.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${member.totalEarnings.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No payroll data found for this period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
