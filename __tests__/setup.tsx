/**
 * @fileoverview Test setup configuration for Vitest
 * 
 * Global test setup including DOM matchers, mocks, and utilities
 * needed across all test files in the application.
 */

import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';

// Mock window.matchMedia for useIsMobile hook tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.ResizeObserver for components that use it
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Firebase modules to avoid initialization in tests
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
  })),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ 
      seconds: date.getTime() / 1000, 
      nanoseconds: 0,
      toDate: () => date 
    })),
  },
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock Next.js image component
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, ...props }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  }),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => {
  const MockIcon = vi.fn(({ children, ...props }) => (
    <svg {...props} data-testid="mock-icon">
      {children}
    </svg>
  ));
  
  return new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return MockIcon;
      }
      return target[prop as keyof typeof target];
    },
  });
});

// Mock Sonner toast library
vi.mock('sonner', () => ({
  toast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  })),
  Toaster: vi.fn(() => <div data-testid="toaster" />),
}));

// Global test utilities
global.testUtils = {
  // Helper to create mock Firestore Timestamp
  createMockTimestamp: (date: Date) => ({
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
    toDate: () => date,
    toMillis: () => date.getTime(),
    isEqual: (other: any) => other.seconds === Math.floor(date.getTime() / 1000),
    valueOf: () => date.getTime().toString(),
  }),
  
  // Helper to create mock user data
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'employee' as const,
    status: 'active' as const,
    createdAt: global.testUtils.createMockTimestamp(new Date()),
    updatedAt: global.testUtils.createMockTimestamp(new Date()),
    // Optional fields - only include if specified in overrides
    ...(overrides.department !== undefined && { department: 'Engineering' }),
    ...(overrides.position !== undefined && { position: 'Developer' }),
    ...(overrides.phoneNumber !== undefined && { phoneNumber: '+1234567890' }),
    ...(overrides.baseSalary !== undefined && { baseSalary: 5000000 }),
    ...overrides,
  }),
  
  // Helper to create mock project data
  createMockProject: (overrides = {}) => ({
    id: 'test-project-id',
    name: 'Test Project',
    description: 'A test project',
    status: 'in-progress' as const,
    priority: 'medium' as const,
    startDate: global.testUtils.createMockTimestamp(new Date()),
    endDate: global.testUtils.createMockTimestamp(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    createdAt: global.testUtils.createMockTimestamp(new Date()),
    updatedAt: global.testUtils.createMockTimestamp(new Date()),
    ...overrides,
  }),
};

// Extend global types for TypeScript
declare global {
  var testUtils: {
    createMockTimestamp: (date: Date) => any;
    createMockUser: (overrides?: any) => any;
    createMockProject: (overrides?: any) => any;
  };
}

// Setup and teardown
beforeAll(() => {
  // Global setup before all tests
});

afterEach(() => {
  // Cleanup after each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Global cleanup after all tests
  vi.restoreAllMocks();
});
