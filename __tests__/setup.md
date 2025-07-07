# Testing Strategy for Team Sync Application

## Overview

This document outlines the testing strategy for the consolidated utility functions and custom hooks in the Team Sync application.

## Testing Framework Recommendation

### Recommended Stack:
- **Vitest** - Fast unit testing framework (better than Jest for modern projects)
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM elements
- **@testing-library/user-event** - User interaction simulation
- **msw** (Mock Service Worker) - API mocking for integration tests

### Installation Command:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react jsdom msw
```

## Test Structure

### Directory Structure:
```
__tests__/
├── setup.ts                 # Test setup and configuration
├── utils/                   # Utility function tests
│   ├── formatDate.test.ts
│   ├── formatRupiah.test.ts
│   ├── cn.test.ts
│   └── badge-helpers.test.ts
├── hooks/                   # Custom hook tests
│   ├── useIsMobile.test.tsx
│   ├── useToast.test.tsx
│   └── usePermission.test.tsx
├── integration/             # Integration tests
│   └── helpers.test.ts
└── mocks/                   # Mock data and handlers
    ├── handlers.ts
    └── data.ts
```

## Priority Testing Areas

### High Priority (Critical Business Logic):

1. **Currency Formatting Functions**
   - `formatRupiah()` - Indonesian currency formatting
   - `formatCurrency()` - Generic currency formatting
   - `parseCurrencyInput()` - Currency input parsing
   - `formatCurrencyInput()` - Currency input formatting

2. **Date Formatting Functions**
   - `formatDate()` - Date formatting with null handling
   - Edge cases: null, undefined, invalid dates, Firestore Timestamps

3. **Badge Helper Functions**
   - `getStatusBadge()` - Project status badge configuration
   - `getPriorityBadge()` - Project priority badge configuration

4. **CSS Utility Functions**
   - `cn()` - Tailwind CSS class merging

### Medium Priority (User Experience):

1. **Custom Hooks**
   - `useIsMobile()` - Mobile breakpoint detection
   - `useToast()` - Toast notification system
   - `usePermission()` - Permission checking

2. **Type Guards**
   - `isFirestoreTimestamp()` - Firestore Timestamp validation
   - `isValidDate()` - Date validation

### Low Priority (Integration):

1. **Centralized Exports**
   - Verify all exports from `lib/helpers.ts`
   - Verify all exports from `hooks/index.ts`

## Test Cases by Function

### formatRupiah()
- ✅ Valid numbers: `1234567 → "Rp 1.234.567"`
- ✅ String numbers: `"1234567" → "Rp 1.234.567"`
- ✅ Without symbol: `1234567, {withSymbol: false} → "1.234.567"`
- ✅ Null/undefined: `null → ""`
- ✅ Invalid input: `"invalid" → ""`
- ✅ Zero: `0 → "Rp 0"`
- ✅ Negative numbers: `-1000 → "Rp -1.000"`

### formatDate()
- ✅ Valid Date object
- ✅ Firestore Timestamp
- ✅ String date
- ✅ Number timestamp
- ✅ Null/undefined input
- ✅ Invalid date string
- ✅ Custom format options
- ✅ Custom fallback message

### cn()
- ✅ Basic class merging
- ✅ Conditional classes
- ✅ Tailwind class conflicts (latest wins)
- ✅ Empty/null inputs
- ✅ Array inputs

### Badge Functions
- ✅ All project status values
- ✅ All priority values
- ✅ Invalid/unknown values (fallback)
- ✅ Return type validation (color, Icon)

### useIsMobile()
- ✅ Desktop viewport (>= 768px)
- ✅ Mobile viewport (< 768px)
- ✅ Viewport resize events
- ✅ SSR compatibility

### useToast()
- ✅ Toast creation
- ✅ Toast dismissal
- ✅ Multiple toasts
- ✅ Toast queue management

## Configuration Files Needed

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### __tests__/setup.ts
```typescript
import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Clean up after all tests
afterAll(() => server.close())

// Mock window.matchMedia for mobile hook tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

## Next Steps

1. **Install testing dependencies**
2. **Create configuration files**
3. **Implement high-priority tests first**
4. **Set up CI/CD integration**
5. **Add test coverage reporting**

## Benefits

- ✅ **Catch regressions** early in development
- ✅ **Document expected behavior** through tests
- ✅ **Improve code quality** and maintainability
- ✅ **Enable confident refactoring**
- ✅ **Reduce production bugs**
