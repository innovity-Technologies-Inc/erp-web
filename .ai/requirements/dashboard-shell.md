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
- [x] Integrate high-fidelity card design with soft borders and shadows.
- [x] Implement complex grid layout (Tall Best Sale card, Full-width Monthly Report).
## 3. High-Fidelity Dashboard
- [x] Create high-fidelity visual mockups (SVG Donut, Bars, and Area charts).
- [x] Implement interactive hover tooltips for Monthly Sales & Purchase chart.
- [x] Add dynamic report tables (Overview, Sales Due, Daily Sales) and metric blocks.
- [x] Connect user profile images with backend storage and auto-avatar fallbacks.
- [x] Integrate `useGetDashboardAnalytics` hook for real-time data synchronization.
- [x] Implement dynamic Y-axis scaling for trend charts based on live data.
- [x] Add robust loading states for a polished SPA experience.
## 4. Shared Domain Utilities
- [ ] Implement currency formatters (BDT).
- [ ] Implement date/time formatters consistent with ERP standards.
- [ ] Create a generic `DataTable` wrapper for AG Grid.
