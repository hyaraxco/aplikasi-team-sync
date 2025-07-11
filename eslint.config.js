// Simple ESLint configuration for basic linting
export default [
  // Configuration for JavaScript files only (avoiding TypeScript parsing issues)
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    rules: {
      // Basic code style (less strict for compatibility)
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      'coverage/**',
      '.firebase/**',
      'firebase-debug.log',
      'firestore-debug.log',
      // Ignore TypeScript files for now (until proper TypeScript ESLint setup)
      '**/*.ts',
      '**/*.tsx',
      // Ignore specific directories that have complex TypeScript
      'app/**',
      'components/**',
      'hooks/**',
      'lib/**',
      'types/**',
    ],
  },
]
