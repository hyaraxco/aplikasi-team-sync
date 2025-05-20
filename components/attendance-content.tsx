"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { CalendarIcon, Clock, LogIn, LogOut } from "lucide-react"
import {
  getAttendanceRecords,
  checkIn,
  checkOut,
  getUserData,
  type AttendanceRecord,
  type UserData,
} from "@/lib/firestore"
import { getUsers } from "@/lib/user-management"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function AttendanceContent() {
  const { user, userRole } = useAuth()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [currentAttendanceId, setCurrentAttendanceId] = useState<string | null>(null)
  const [hourlyRate, setHourlyRate] = useState(20) // Default hourly rate
  const [activeTab, setActiveTab] = useState("all")
  const [users, setUsers] = useState<UserData[]>([])
  const [userMap, setUserMap] = useState<Record<string, UserData>>({})

  // Function to check if user is already checked in today
  const checkIfUserIsCheckedIn = async () => {
    if (!user) return false

    try {
      const today = new Date()
      const startOfToday = startOfDay(today)
      const endOfToday = endOfDay(today)

      // Query Firestore directly to find today's attendance record without checkout
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("userId", "==", user.uid),
        where("date", ">=", Timestamp.fromDate(startOfToday)),
        where("date", "<=", Timestamp.fromDate(endOfToday)),
      )

      const querySnapshot = await getDocs(attendanceQuery)

      // Find a record that doesn't have checkOut
      const todayRecord = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as AttendanceRecord)
        .find((record) => !record.checkOut)

      if (todayRecord) {
        setIsCheckedIn(true)
        setCurrentAttendanceId(todayRecord.id)
        setCheckInTime(format(todayRecord.checkIn.toDate(), "hh:mm a"))
        return true
      }

      return false
    } catch (error) {
      console.error("Error checking if user is checked in:", error)
      return false
    }
  }

  // Function to fetch attendance data
  const fetchAttendanceData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Fetch attendance records
      let records: AttendanceRecord[] = []

      if (userRole === "admin") {
        // Admin sees all attendance records
        records = await getAttendanceRecords()

        // Also fetch all users for admin view
        const allUsers = await getUsers()
        setUsers(allUsers)

        // Create a map of user IDs to user data for quick lookup
        const userMapData: Record<string, UserData> = {}
        allUsers.forEach((user) => {
          userMapData[user.id] = user
        })
        setUserMap(userMapData)
      } else {
        // Regular users only see their own records
        records = await getAttendanceRecords(user.uid)
      }

      console.log("Fetched attendance records:", records)
      setAttendanceRecords(records)

      // Check if user is already checked in today
      await checkIfUserIsCheckedIn()

      // Get user data to get hourly rate
      if (user) {
        const userData = await getUserData(user.uid)
        if (userData && userData.hourlyRate) {
          setHourlyRate(userData.hourlyRate)
        }
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error)
      setError("Failed to load attendance data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceData()
  }, [user, userRole])

  const handleCheckIn = async () => {
    if (!user) return

    try {
      setError(null)
      setActionLoading(true)

      const attendanceId = await checkIn(user.uid, hourlyRate)
      setCurrentAttendanceId(attendanceId)
      setIsCheckedIn(true)
      setCheckInTime(format(new Date(), "hh:mm a"))

      // Refresh attendance records
      await fetchAttendanceData()
    } catch (error) {
      console.error("Error checking in:", error)
      setError("Failed to check in. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!user || !currentAttendanceId) return

    try {
      setError(null)
      setActionLoading(true)

      await checkOut(currentAttendanceId, user.uid)
      setIsCheckedIn(false)
      setCurrentAttendanceId(null)
      setCheckInTime(null)

      // Refresh attendance records
      await fetchAttendanceData()
    } catch (error) {
      console.error("Error checking out:", error)
      setError("Failed to check out. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  // Helper function to calculate total hours worked
  const calculateTotalHours = (records: AttendanceRecord[]): number => {
    return records.reduce((total, record) => {
      return total + (record.hoursWorked || 0)
    }, 0)
  }

  // Filter records based on selected tab
  const getFilteredRecords = (): AttendanceRecord[] => {
    const now = new Date()

    switch (activeTab) {
      case "today":
        return attendanceRecords.filter((record) => {
          const recordDate = record.date.toDate()
          return format(recordDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
        })
      case "week":
        const oneWeekAgo = new Date(now)
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return attendanceRecords.filter((record) => {
          const recordDate = record.date.toDate()
          return recordDate >= oneWeekAgo && recordDate <= now
        })
      case "month":
        if (!selectedMonth) return []
        const monthStart = startOfMonth(selectedMonth)
        const monthEnd = endOfMonth(selectedMonth)
        return attendanceRecords.filter((record) => {
          const recordDate = record.date.toDate()
          return isWithinInterval(recordDate, { start: monthStart, end: monthEnd })
        })
      default:
        return attendanceRecords
    }
  }

  // Filter records for the current month
  const currentMonthRecords = attendanceRecords.filter((record) => {
    if (!selectedMonth) return false

    const recordDate = record.date.toDate()
    return (
      recordDate.getMonth() === selectedMonth.getMonth() && recordDate.getFullYear() === selectedMonth.getFullYear()
    )
  })

  // Calculate monthly statistics
  const monthlyTotalHours = calculateTotalHours(currentMonthRecords)
  const monthlyWorkingDays = new Set(currentMonthRecords.map((record) => format(record.date.toDate(), "yyyy-MM-dd")))
    .size
  const averageHoursPerDay = monthlyWorkingDays > 0 ? monthlyTotalHours / monthlyWorkingDays : 0

  const filteredRecords = getFilteredRecords()

  // Helper function to get user name from user ID
  const getUserName = (userId: string): string => {
    const userData = userMap[userId]
    if (userData) {
      return userData.displayName || userData.email || userId
    }
    return userId
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          {userRole === "admin" ? "Track team attendance" : "Track your attendance"}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>{format(new Date(), "EEEE, MMMM do, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : userRole === "user" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>Current Status:</span>
                  </div>
                  <Badge
                    className={
                      isCheckedIn
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    }
                  >
                    {isCheckedIn ? "Checked In" : "Not Checked In"}
                  </Badge>
                </div>
                {checkInTime && isCheckedIn && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LogIn className="h-5 w-5 text-muted-foreground" />
                      <span>Check-in Time:</span>
                    </div>
                    <span>{checkInTime}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCheckIn} disabled={isCheckedIn || actionLoading} className="flex-1">
                    {actionLoading && !isCheckedIn ? (
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    Check In
                  </Button>
                  <Button
                    onClick={handleCheckOut}
                    disabled={!isCheckedIn || actionLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    {actionLoading && isCheckedIn ? (
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Check Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-lg font-medium">Team Check-ins Today</p>
                  <p className="text-3xl font-bold mt-2">
                    {
                      attendanceRecords.filter((record) => {
                        const recordDate = record.date.toDate()
                        return format(recordDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                      }).length
                    }{" "}
                    / {users.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">team members checked in</p>
                </div>
                <div className="space-y-2">
                  {attendanceRecords
                    .filter((record) => {
                      const recordDate = record.date.toDate()
                      return format(recordDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                    })
                    .map((record) => (
                      <div key={record.id} className="flex items-center justify-between">
                        <span>{getUserName(record.userId)}</span>
                        <Badge
                          className={
                            record.checkOut
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          }
                        >
                          {record.checkOut ? "Completed" : "Checked In"}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>{format(selectedMonth || new Date(), "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total Working Days:</span>
                  <span className="font-medium">{monthlyWorkingDays}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Days Present:</span>
                  <span className="font-medium">{monthlyWorkingDays}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Days Absent:</span>
                  <span className="font-medium">
                    {/* This would be calculated from actual data in a real app */}
                    {Math.max(0, 22 - monthlyWorkingDays)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Hours:</span>
                  <span className="font-medium">{monthlyTotalHours.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average Hours/Day:</span>
                  <span className="font-medium">{averageHoursPerDay.toFixed(1)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Attendance Calendar</CardTitle>
            <CardDescription>View your attendance for the month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedMonth ? format(selectedMonth, "MMMM yyyy") : <span>Pick a month</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedMonth} onSelect={setSelectedMonth} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Logs</CardTitle>
          <CardDescription>
            {userRole === "admin" ? "View all attendance records" : "Your attendance records"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
              ) : filteredRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {userRole === "admin" && <TableHead>User</TableHead>}
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        {userRole === "admin" && <TableCell>{getUserName(record.userId)}</TableCell>}
                        <TableCell>{record.date.toDate().toLocaleDateString()}</TableCell>
                        <TableCell>{format(record.checkIn.toDate(), "hh:mm a")}</TableCell>
                        <TableCell>
                          {record.checkOut ? format(record.checkOut.toDate(), "hh:mm a") : "Not checked out"}
                        </TableCell>
                        <TableCell>{record.hoursWorked?.toFixed(2) || "N/A"}</TableCell>
                        <TableCell>${record.hourlyRate.toFixed(2)}</TableCell>
                        <TableCell>${record.earnings?.toFixed(2) || "0.00"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-6 text-center text-muted-foreground">No attendance records found</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
