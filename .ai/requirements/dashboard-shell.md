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
- [x] Implement complex 4-column grid layout with nested cards and specific row/column spanning.
- [x] Implement redesign of Topbar (logo, date pickers) and Sidebar (active states, brand colors).
## 3. High-Fidelity Dashboard
- [x] Create high-fidelity visual mockups (SVG Donut, Bars, and Area charts).
- [x] Implement interactive hover tooltips for Monthly Sales & Purchase chart.
- [x] Add dynamic report tables (Overview, Sales Due, Daily Sales) and metric blocks.
- [x] Connect user profile images with backend storage and auto-avatar fallbacks.
- [x] Integrate `useGetDashboardAnalytics` hook for real-time data synchronization.
- [x] Implement dynamic Y-axis scaling and automated X-axis grid values for trend and bar charts.
- [x] Implement high-fidelity financial tables (Dues, Sales Reports) using semantic HTML with calculated footer totals.
- [x] Integrate custom branded PNG icons into StatCards with interactive color transitions.
- [x] Add dark drop shadows and smoothed area gradients to the monthly trend visualization.
- [x] Add robust loading states for a polished SPA experience.
## 4. Shared Domain Utilities
- [ ] Implement currency formatters (BDT).
- [ ] Implement date/time formatters consistent with ERP standards.
- [ ] Create a generic `DataTable` wrapper for AG Grid.
