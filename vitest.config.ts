/**
 * @fileoverview Vitest configuration for Team Sync application
 *
 * Configures the testing environment with React support, path aliases,
 * and proper setup for testing utility functions and custom hooks.
 */

import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React component testing
    environment: 'jsdom',

    // Global test setup
    globals: true,
    setupFiles: ['__tests__/setup.tsx'],

    // Test file patterns
    include: ['__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}', 'src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'coverage'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '__tests__/', 'coverage/', '.next/', '*.config.*', 'types/'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Test timeout
    testTimeout: 10000,

    // Reporter configuration
    reporters: ['verbose'],
  },

  // Path resolution (same as Next.js)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/types': path.resolve(__dirname, './types'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/components': path.resolve(__dirname, './components'),
      '@/app': path.resolve(__dirname, './app'),
    },
  },

  // Define global variables for testing
  define: {
    'process.env.NODE_ENV': '"test"',
  },
})
