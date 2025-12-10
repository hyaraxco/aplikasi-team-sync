# Status Badge System Documentation

## Overview
This document describes the reusable status badge system implemented to provide consistent styling and accessibility across all components that display user status information.

## Problem Solved
1. **Code Duplication**: Multiple components had duplicate `getStatusBadge` functions
2. **Dark Mode Accessibility**: Poor contrast ratios in dark mode, especially for pending status
3. **Inconsistent Styling**: Different components used different color schemes
4. **Maintainability**: Changes required updating multiple files

## Solution Architecture

### 1. Utility Function (`lib/ui/utils.ts`)
```typescript
export const getUserStatusBadge = (status: string | undefined | null) => {
  const normalizedStatus = status?.toLowerCase() as UserStatus
  
  const statusConfig: Record<UserStatus, { className: string; text: string }> = {
    active: {
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      text: 'Active'
    },
    pending: {
      className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      text: 'Pending'
    },
    // ... other statuses
  }
  
  return statusConfig[normalizedStatus] || defaultConfig
}
```

### 2. Reusable Component (`components/atomics/UserStatusBadge.atomic.tsx`)
```typescript
export const UserStatusBadge = ({ status, className = '' }: UserStatusBadgeProps) => {
  const statusConfig = getUserStatusBadge(status)

  return (
    <Badge 
      variant="outline" 
      className={`${statusConfig.className} ${className}`}
    >
      {statusConfig.text}
    </Badge>
  )
}
```

## Dark Mode Accessibility Improvements

### Before (Poor Contrast)
```css
/* Pending status - poor dark mode contrast */
.border-blue-300 { border-color: #93c5fd; }
.text-blue-600 { color: #2563eb; }
```

### After (WCAG Compliant)
```css
/* Pending status - proper dark mode contrast */
.dark\:bg-blue-900\/20 { background-color: rgb(30 58 138 / 0.2); }
.dark\:text-blue-400 { color: #60a5fa; }
.dark\:border-blue-800 { border-color: #1e40af; }
```

## Status Types Supported

| Status | Light Mode | Dark Mode | Use Case |
|--------|------------|-----------|----------|
| **Active** | Green | Green-400 | User is active and can access system |
| **Inactive** | Gray | Gray-300 | User is temporarily inactive |
| **Pending** | Blue | Blue-400 | User awaiting admin approval |
| **On Leave** | Yellow | Yellow-400 | User is on leave |
| **Suspended** | Red | Red-400 | User account is suspended |

## Usage Examples

### Basic Usage
```tsx
import { UserStatusBadge } from '@/components/atomics'

// Simple usage
<UserStatusBadge status="pending" />

// With additional styling
<UserStatusBadge status="active" className="ml-2" />
```

### In Table Components
```tsx
<TableCell>
  <UserStatusBadge status={user.status} />
</TableCell>
```

## Migration Guide

### Before (Duplicated Code)
```tsx
// Multiple components had this duplicated function
const getStatusBadge = (user: UserData) => {
  switch (user.status?.toLowerCase()) {
    case 'active':
      return <Badge className='bg-green-100 text-green-700'>Active</Badge>
    case 'pending':
      return <Badge className='border-blue-300 text-blue-600'>Pending</Badge>
    // ... more cases
  }
}

// Usage
<TableCell>{getStatusBadge(user)}</TableCell>
```

### After (Reusable Component)
```tsx
import { UserStatusBadge } from '@/components/atomics'

// Usage
<TableCell>
  <UserStatusBadge status={user.status} />
</TableCell>
```

## Components Updated

1. **UserTable.section.tsx** - Main user management table
2. **MemberTable.section.tsx** - Team member management table
3. **Future components** - Can easily use the same system

## Benefits

### 1. **Consistency**
- All status badges use the same color scheme
- Consistent text formatting and capitalization
- Unified spacing and sizing

### 2. **Accessibility**
- WCAG compliant contrast ratios in both light and dark modes
- Proper semantic markup with Badge component
- Screen reader friendly text

### 3. **Maintainability**
- Single source of truth for status styling
- Easy to add new status types
- Centralized color scheme management

### 4. **Developer Experience**
- Simple API with TypeScript support
- Automatic fallback for unknown statuses
- Consistent naming conventions

## Future Enhancements

1. **Icon Support**: Add optional icons for each status
2. **Animation**: Subtle transitions for status changes
3. **Tooltip**: Additional context on hover
4. **Custom Statuses**: Support for organization-specific statuses

## Testing

### Accessibility Testing
- [x] Contrast ratios meet WCAG AA standards
- [x] Screen reader compatibility
- [x] Keyboard navigation support

### Visual Testing
- [x] Light mode appearance
- [x] Dark mode appearance
- [x] Responsive behavior
- [x] Modern-minimal theme compatibility

## Related Files

- `lib/ui/utils.ts` - Utility function
- `components/atomics/UserStatusBadge.atomic.tsx` - Component
- `components/atomics/index.ts` - Export
- `app/users/section/UserTable.section.tsx` - Implementation
- `app/teams/[id]/section/MemberTable.section.tsx` - Implementation
