# Phase 1: Foundation & Project Setup Requirements

This document outlines the requirements for setting up the initial foundation of the `erp_frontend` React application.

## 1. Project Initialization
- [x] Initialize a React project using Vite with TypeScript.
- [x] Configure Tailwind CSS for styling.
- [x] Set up path aliases (`@/` for `src/`) in both Vite and TypeScript configurations.
- [x] Establish the modular folder structure.

## 2. Core Dependencies
- [x] Install state management libraries: `zustand`, `@tanstack/react-query`.
- [x] Install routing: `@tanstack/react-router`.
- [x] Install form and validation libraries: `react-hook-form`, `zod`, `@hookform/resolvers`.
- [x] Install HTTP client: `axios`.
- [x] Install UI and Table libraries: `ag-grid-react`, `ag-grid-community`, `lucide-react`.

## 3. Global Infrastructure
- [x] Configure Axios with a base URL from environment variables.
- [x] Implement an Axios request interceptor to attach JWT tokens.
- [x] Implement a global error handler and notification system via Zustand.
- [x] Create a visual notification (Toast) component to display messages from the UI store.
- [x] Ensure the login system properly handles and displays backend validation and authentication errors.
- [x] Create basic global layout components (AuthLayout).
- [x] Implement dynamic user data handling (first_name, last_name, roles) in Topbar and Dashboard.
- [x] Implement real-time clock and date display in Dashboard.

## 4. Authentication Foundation
- [x] Create `useAuthStore` with support for JWT persistence in `localStorage`.
- [x] Define basic TypeScript interfaces for `User` and `Permission`.
- [x] Set up an `AuthGuard` for route protection (Logical implementation in router).

## 5. Forgot Password Functionality
- [x] Implement backend API endpoints for forgot password and reset password in `authkit` module.
- [x] Create `Forgot Password` view in React frontend.
- [x] Create `Reset Password` view in React frontend.
- [x] Integrate with TanStack Query hooks for password reset flow.
