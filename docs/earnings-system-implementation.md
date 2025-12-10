# Earnings-Based Compensation System

## Overview

This document describes the implementation of the earnings-based compensation
system that replaces the fixed salary system for employee users. The system
calculates earnings based on performance metrics: task completion and attendance
tracking.

## System Architecture

### 1. Database Layer (`lib/database/firestore.ts`)

#### New Function: `calculateUserEarnings`

```typescript
export async function calculateUserEarnings(userId: string): Promise<{
  taskEarnings: number
  attendanceEarnings: number
  totalEarnings: number
  taskCount: number
  attendanceCount: number
}>
```

**Purpose**: Calculates total earnings for a user from both task completion and
attendance records.

**Data Sources**:

- `earnings` collection - stores individual earning records
- Filters by `userId` and separates by `type` ('task' | 'attendance')

### 2. Hooks Layer (`hooks/data/use-user-earnings.tsx`)

#### `useUserEarnings(users: UserData[])`

- Batch processes earnings calculation for multiple users
- Implements efficient batching (5 users at a time) to avoid database overload
- Returns `Map<string, UserEarningsData>` for O(1) lookup

#### `useSingleUserEarnings(userId, userRole)`

- Calculates earnings for a single user
- Optimized for individual user views
- Returns `UserEarningsData` object

### 3. UI Components

#### `EarningsCell` Component (`components/molecules/EarningsCell.molecule.tsx`)

- **Interactive Display**: Click to expand earnings breakdown
- **Tooltip Breakdown**: Shows task vs attendance earnings
- **Role-Based Display**: Shows "N/A" for admin users
- **Loading States**: Skeleton loading during calculation
- **Error Handling**: Graceful error display

#### Features:

- **Total Earnings**: Primary display value
- **Breakdown Tooltip**:
  - Task completion earnings + count
  - Attendance earnings + count
  - Total calculation
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Earnings Calculation Logic

### Task Completion Earnings

```typescript
// Earnings created when admin approves a task (status: 'done')
await createEarning({
  userId: assigneeId,
  type: 'task',
  refId: taskId,
  amount: taskData.taskRate, // Per task rate
})
```

### Attendance Earnings

```typescript
// Earnings created when user works >= 8 hours
if (hoursWorked >= 8) {
  // Get user data to determine earning amount based on role
  const userData = await getUserData(userId)
  const earningAmount = userData?.role === 'admin' ? 200000 : 10000 // Admin: Rp 200,000, Employee: Rp 10,000

  await createEarning({
    userId: userId,
    type: 'attendance',
    refId: attendanceId,
    amount: earningAmount,
  })
}
```

## User Table Implementation

### Before (Salary-Based)

```tsx
<TableHead>Salary</TableHead>
// ...
<TableCell>
  {typeof user.baseSalary === 'number' ? formatRupiah(user.baseSalary) : '-'}
</TableCell>
```

### After (Earnings-Based)

```tsx
<TableHead>Earnings</TableHead>
// ...
<TableCell>
  <EarningsCell
    taskEarnings={userEarnings.taskEarnings}
    attendanceEarnings={userEarnings.attendanceEarnings}
    totalEarnings={userEarnings.totalEarnings}
    taskCount={userEarnings.taskCount}
    attendanceCount={userEarnings.attendanceCount}
    loading={userEarnings.loading}
    error={userEarnings.error}
    userRole={user.role}
  />
</TableCell>
```

## Role-Based Display Logic

### Employee Users

- **Display**: Total earnings with breakdown tooltip
- **Calculation**: Real-time calculation from earnings records
- **Breakdown**: Shows task completion + attendance earnings
- **Daily Rate**: Rp 10,000 for ≥8 hours attendance

### Admin Users

- **Display**: Total earnings with breakdown tooltip (same as employees)
- **Calculation**: Real-time calculation from earnings records
- **Breakdown**: Shows task completion + attendance earnings
- **Daily Rate**: Rp 200,000 for ≥8 hours attendance (20x employee rate)
- **Participation**: Full participation in attendance tracking system

## Performance Optimizations

### 1. Batch Processing

```typescript
// Process users in batches of 5 to avoid overwhelming database
const batchSize = 5
for (let i = 0; i < users.length; i += batchSize) {
  const batch = users.slice(i, i + batchSize)
  // Process batch...
}
```

### 2. Efficient Data Structure

```typescript
// Use Map for O(1) lookup instead of array search
const earningsMap = new Map<string, UserEarningsData>()
```

### 3. Role-Based Optimization

```typescript
// Skip calculation for admin users
if (user.role === 'employee') {
  const earnings = await calculateUserEarnings(user.id)
} else {
  // Return default data for admin users
}
```

## Error Handling

### Database Errors

- Graceful fallback to zero earnings
- Error logging for debugging
- User-friendly error messages

### Loading States

- Skeleton components during calculation
- Progressive loading for batch operations
- Responsive feedback

## Integration Points

### 1. Existing Earnings System

- Leverages existing `Earning` type and database structure
- Uses existing `createEarning` function
- Compatible with existing earnings tracking

### 2. Task Management

- Integrates with task approval workflow
- Earnings created when tasks move to 'done' status
- Uses existing `taskRate` field

### 3. Attendance System

- Integrates with check-in/check-out workflow
- Earnings created for >= 8 hour workdays
- Uses existing attendance tracking

## Future Enhancements

### 1. Configurable Rates

- Admin-configurable task rates
- Variable attendance rates based on performance
- Bonus multipliers for exceptional performance

### 2. Reporting Features

- Earnings history and trends
- Performance analytics
- Export capabilities

### 3. Advanced Calculations

- Overtime calculations
- Holiday bonuses
- Team performance bonuses

## Migration Notes

### Data Migration

- Existing `baseSalary` field preserved for historical data
- New earnings calculated from existing task and attendance records
- No data loss during transition

### Backward Compatibility

- Old salary-based components still functional
- Gradual migration approach possible
- Rollback capability maintained

## Testing Considerations

### Unit Tests

- Test earnings calculation logic
- Test role-based display logic
- Test error handling scenarios

### Integration Tests

- Test with real database data
- Test batch processing performance
- Test UI component interactions

### Performance Tests

- Test with large user datasets
- Test concurrent earnings calculations
- Test database query optimization
