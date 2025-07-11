module.exports = {
  // Basic formatting
  semi: false,
  singleQuote: true,
  jsxSingleQuote: true,
  quoteProps: 'as-needed',

  // Indentation and spacing
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,

  // Trailing commas and brackets
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,

  // Arrow functions
  arrowParens: 'avoid',

  // Line endings and whitespace
  endOfLine: 'lf',
  insertPragma: false,
  requirePragma: false,

  // JSX specific
  jsxBracketSameLine: false,

  // Plugins for import organization and formatting
  plugins: [require.resolve('prettier-plugin-organize-imports')],

  // File-specific overrides
  overrides: [
    {
      files: '*.{js,jsx,ts,tsx}',
      options: {
        parser: 'typescript',
      },
    },
    {
      files: '*.json',
      options: {
        parser: 'json',
        trailingComma: 'none',
      },
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        printWidth: 80,
        proseWrap: 'always',
      },
    },
  ],
}
