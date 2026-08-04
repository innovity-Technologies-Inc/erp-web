# HRM Module Migration Notes & Guidelines

## 1. Scope of Work
- Migrate the existing Laravel Blade + AJAX HRM module to React SPA (Vite + TypeScript).
- Source logic and conditions from the backend package: `erp_new/Applets/hrm/src/`.
- **DO NOT** write any implementation code until the USER explicitly gives the signal to start.

## 2. Design Standards & Consistency
- **Layout & Structure**: Match established pages (1600px max width, px-4, space-y-6, ListPageLayout).
- **Typography**: Poppins font family. Font size and weight matching exactly (13px for body/inputs, medium weight for labels, semibold/bold for totals/headers).
- **Headers & Buttons**:
  - Branded Box Style Back Button with strokeWidth={3} icon.
  - Save/Update (Primary): Green (`bg-[#059669]`, hover: `bg-[#047857]`).
  - Cancel/Reset (Secondary): White/Gray (`bg-white text-[#64748b] border border-gray-200`).
  - Table Action Icons: View (Blue), Edit (Emerald), Delete (Rose). All icons must have `hover:scale-110` transition.
- **Form Controls & Dropdowns**:
  - Focus style: `focus:ring-1 focus:ring-primary/30 focus:border-primary`.
  - Dropdowns: Use custom `Select2` component (no native select).
- **Data Validation & Modals**:
  - Zod schemas matched with Laravel request validation.
  - Discard protection (dirty form check on exit) for Create pages.
  - Successful form submissions must use `NotificationModal` (via `useUiStore`).
- **AG Grid Tables**: Double-check SL calculation, column visibility toggle reactivity using `useMemo` dependencies, status badge styling, and date filter synchronization.

## 3. Workflow Rules
- **Step 1**: Analyze backend files under `Applets/hrm/src/Routes`, `Http/Controllers`, `Models`, and `Resources/views`.
- **Step 2**: Present a clear plan of the database models, controllers, API routes, and front-end routes/view files required.
- **Step 3**: Wait for the USER's signal before writing any code.
- **Step 4**: When all tasks are completed and verified, request explicit user permission before committing and pushing changes to git.
