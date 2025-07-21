# Project Overview

This project, named Team Sync, is a web app for managing projects, tasks, teams,
attendance, and payroll. The system uses Firebase (Firestore + Auth), supports
Admin and User roles, and shares UI components across roles. Payroll is
calculated based on completed tasks and daily check-in/check-out logs.is built
using Next.js and TypeScript. It integrates various libraries for state
management, UI components, and data fetching.

# Project Structure

- **Components**: Contains reusable UI components.
- **App**: Next.js app for routing.
- **Hooks**: Custom React hooks for state management.
- **Lib**: Utility functions and types.
- **Public**: Static assets.
- **Styles**: Global styles and Tailwind CSS configuration.

# Development Guidelines

- Use TypeScript for type safety.
- Follow the coding standards defined in the ESLint configuration.
- Ensure all components are responsive and accessible.
- Use Tailwind CSS for styling, adhering to the defined color palette.

# Language Requirements

- **English Only**: All user-facing text, UI labels, messages, and content must
  be in English.
- **No Indonesian Text**: Do not use Indonesian words or phrases in any UI
  components, error messages, success messages, button labels, or user-facing
  content.
- **Code Comments**: Write all code comments and documentation in English.
- **Error Messages**: All error messages, validation messages, and toast
  notifications must be in English.
- **Form Labels**: All form labels, placeholders, and help text must be in
  English.
- **Navigation**: All menu items, page titles, and navigation elements must be
  in English.
- **Data Display**: All table headers, column names, and data labels must be in
  English.

# Currency and Localization Standards

- **Currency**: Use Indonesian Rupiah (IDR) for all monetary values throughout
  the application.
- **Currency Format**: Use `formatRupiah()` function from `@/lib/ui` for
  displaying currency values.
- **Currency Symbol**: Display currency with "Rp" prefix and Indonesian number
  formatting (e.g., "Rp 1.234.567").
- **Salary Display**: All salary, earnings, payroll, and financial data must be
  formatted in Indonesian Rupiah.
- **Currency Input**: Use `formatCurrencyInput()` and `parseCurrencyInput()`
  functions for handling currency input fields.

# Component Standards

- **Date Picker**: Always use `@/components/molecules/AntDatePicker` for all
  date selection needs.
- **Date Picker Types**: Use appropriate picker type (DatePicker, WeekPicker,
  MonthPicker, YearPicker, RangePicker) based on requirements.
- **Date Format**: Handle Date, Timestamp, and null values properly using the
  AntDatePicker component.
- **Date Consistency**: Maintain consistent date handling across all forms and
  components.

# Important Scripts

- `dev`: Starts the development server.
- `build`: Builds the application for production.

# AI Interaction Guidelines

- When generating code, prioritize TypeScript and React best practices.
- Ensure that any new components are reusable and follow the existing design
  patterns.
- Minimize the use of AI generated comments, instead use clearly named variables
  and functions.
- Always validate user inputs and handle errors gracefully.
- Use the existing components and pages as a reference for the new components
  and pages.
- Use the existing state management and data fetching logic as a reference for
  new features.
- Ensure that the generated code is compatible with the existing codebase.
- Ensure the page is responsive and accessible.
- Ensure optimize the page for performance.
- Ensure that the generated code is compatible with the existing codebase.
- Ensure that every page with list or display data has a loading state with
  skeleton loading and empty state.
- **Language Compliance**: Always use English for all user-facing text, error
  messages, labels, and comments. Never use Indonesian or any other language.
- **Text Consistency**: Follow existing English text patterns and maintain
  professional, clear messaging throughout the application.
- **Currency Compliance**: Always use Indonesian Rupiah (IDR) formatting for all
  monetary values using `formatRupiah()` function.
- **Date Picker Compliance**: Always use `@/components/molecules/AntDatePicker`
  components for any date selection functionality.
- **Component Consistency**: Use existing standardized components and follow
  established patterns for currency and date handling.
- **Code Consistency**: Maintain consistent code style and formatting across the
  feature.

# Team Sync of Terms and Concepts

- **Team Sync**: A web app for managing projects, tasks, teams, attendance, and
  payroll.
- **Firebase**: A platform for building web, providing authentication and
  database services.
- **Firestore**: A NoSQL document database provided by Firebase for storing and
  syncing data.

# Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
