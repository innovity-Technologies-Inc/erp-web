# Phase 2: Dashboard Shell & Private Infrastructure Tasks

## Task Group 1: Layout & Navigation
- [x] **Task 1.1**: Create `src/layouts/AppShell/AppShell.tsx`.
- [x] **Task 1.2**: Implement `src/layouts/AppShell/Sidebar.tsx` with Lucide icons.
- [x] **Task 1.3**: Implement `src/layouts/AppShell/Topbar.tsx` with user profile dropdown.
- [x] **Task 1.4**: Make user profile picture dynamic with backend storage mapping and fallback logic.

## Task Group 2: Route Protection
- [x] **Task 2.1**: Implement `src/layouts/guards/AuthGuard.tsx`.
- [x] **Task 2.2**: Implement `src/layouts/guards/PermissionGuard.tsx`.
- [x] **Task 2.3**: Update `src/routes/` to include a protected route group (`_authenticated`).

## Task Group 3: Core Dashboard Module
- [x] **Task 3.1**: Create `src/modules/dashboard/` structure.
- [x] **Task 3.2**: Implement a basic summary grid in `DashboardPage.tsx`.
- [x] **Task 3.3**: Refactor Dashboard grid to match high-fidelity sample (tall right card).
- [x] **Task 3.4**: Implement SVG-based high-fidelity chart mockups (Donut, Bar, Area).
- [x] **Task 3.5**: Polish Dashboard styling (Glassmorphism borders, soft shadows).
- [x] **Task 3.6**: Implement interactive tooltips for Monthly Sales & Purchase chart.
- [x] **Task 3.7**: Implement high-fidelity metric cards (Income vs Expense) and multi-table daily reports.
- [x] **Task 3.8**: Create Dashboard API types and TanStack Query data-fetching hook.
- [x] **Task 3.9**: Refactor Dashboard components to map live backend data (Charts, Stats, Tables).
- [x] **Task 3.10**: Implement dynamic chart scaling and centered loading states.
- [x] **Task 3.11**: Redesign Dashboard with 4-column grid, new StatCards, and centered-label Donut charts.
- [x] **Task 3.12**: Update Topbar with logo, date pickers, and revised user profile layout.
- [x] **Task 3.13**: Match Sidebar colors, icons, and active states with high-fidelity prototype.
- [x] **Task 3.14**: Implement `StatCard` hover effects and integrate custom branded PNG icons.
- [x] **Task 3.15**: Build dynamic grid scaling for `Best Sale Product` bar chart (0, 200, 400... auto-calculated).
- [x] **Task 3.16**: Redesign `Todays Overview` using semantic HTML tables with "slim smart" aesthetics.
- [x] **Task 3.17**: Implement specialized financial report cards (Sales Due, Purchase Due, Sales Report) with dynamic totals.
- [x] **Task 3.18**: Enhance Monthly Trend chart with dark line shadows (SVG filters) and slim tooltips.
- [x] **Task 3.19**: Enforce strict use of 5 basic backend colors across all dashboard elements.

## Task Group 4: Global Helpers
- [x] **Task 4.1**: Implement `src/utils/formatters.ts`.
- [x] **Task 4.2**: Implement `src/components/DataTable/DataTable.tsx`.
