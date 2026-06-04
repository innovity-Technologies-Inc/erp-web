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
- [x] Install UI and Table libraries: `ag-grid-react`, `ag-grid-community`, `lucide-react`, `react-select`.

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
- [x] Set up an `AuthGuard` for route protection and ensure state mutations (like token expiration) happen safely outside the render phase.
- [x] Ensure the `AuthLayout` is fully scrollable (`overflow-y-auto`) to prevent content clipping on small screens or during inspection.
- [x] Integrate full **Forgot Password** and **Reset Password** flows, ensuring API payloads and frontend routing match backend expectations.
- [x] Establish backend coordination for unauthenticated email dispatch using `DynamicMailConfigService`.

## 6. Dynamic Branding & Settings
- [x] Create a public API endpoint for fetching global site settings (web_settings, company_information).
- [x] Implement a `useSettingsStore` to cache global branding settings.
- [x] Create a `useSettings` hook to provide easy access to logos, site names, and themes.
- [x] **Optimize Global Settings**: Implement "Only-on-Login" fetch logic to prevent redundant API calls per page.
- [x] Update Authentication pages (Login, Forgot, Reset) to dynamically display logos and site names with fallbacks.
- [x] Establish a "Single Source of Truth" for theme colors (Primary, Info, Success, Warning, Danger) driven by the backend.
- [x] Configure Tailwind v4 to use dynamic CSS variables for all branded UI elements.
- [x] Centralize all ERP-specific design tokens and base styles in `globals.css`.
## 7. Design System & Typography
- [x] Standardize on Poppins font globally.
- [x] Implement precise Figma typography tokens for all authentication and core views.
- [x] Replace all native HTML `<select>` elements with a globally styled `Select2` component (built on `react-select`) to ensure virtual DOM compatibility and a premium user experience.

## 8. Permissions & Security
- [x] Implement a `usePermissions` hook to check user permissions and roles.
- [x] **Super-Admin Access**: Ensure the `Super-Admin` role bypasses all permission checks (access anything).
- [x] Implement a `PermissionGuard` component for declarative permission-based rendering.
- [x] Standardize permission-based visibility for all action buttons (Create, Edit, Delete, View) across the project.

