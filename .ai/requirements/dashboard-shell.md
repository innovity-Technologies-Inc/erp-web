# Phase 2: Dashboard Shell & Private Infrastructure

## 1. AppShell Layout
- [x] Implement the `AppShell` component with Sidebar and Topbar.
- [x] Design the navigation menu based on user roles and permissions.
- [x] Implement a collapsible sidebar logic using `useUiStore`.

## 2. Authentication Guards
- [x] Create a reusable `AuthGuard` component to wrap private routes.
- [x] Implement a `PermissionGuard` for feature-level access control.
- [x] Set up route-level protection in TanStack Router.

## 3. Dashboard Homepage
- [x] Create a basic `DashboardPage` view.
- [x] Implement summary widgets (total products, active employees, etc.).

## 4. Shared Domain Utilities
- [ ] Implement currency formatters (BDT).
- [ ] Implement date/time formatters consistent with ERP standards.
- [ ] Create a generic `DataTable` wrapper for AG Grid.
