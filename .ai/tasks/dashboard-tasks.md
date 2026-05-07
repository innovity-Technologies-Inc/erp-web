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

## Task Group 4: Global Helpers
- [ ] **Task 4.1**: Implement `src/utils/formatters.ts`.
- [ ] **Task 4.2**: Implement `src/components/DataTable/DataTable.tsx`.
