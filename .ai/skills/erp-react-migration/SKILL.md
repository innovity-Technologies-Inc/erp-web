---
name: erp-react-migration
description: |
  Use this skill for ANY task related to this Laravel → React ERP migration project.
  Triggers on: converting Blade templates to React components, creating new ERP modules
  (Inventory, Accounts, HRM), writing API hooks, setting up folder structure, fixing
  migration issues, writing TypeScript types from Laravel models, connecting React to
  Laravel JWT auth, or any frontend task in this specific ERP project.

  ALWAYS use this skill when the user mentions any of these:
  - "ERP", "blade convert", "laravel api", "inventory module", "hrm", "accounts", "payroll"
  - Writing React components, hooks, pages, or features for this project
  - Setting up Zustand store, TanStack Query hooks, Zod schemas, AG Grid tables
  - JWT interceptor, auth guard, permission check
  - Figma design token export to Tailwind
  - Any file inside erp-frontend/ src/ folder
  - "module", "feature", "entity", "shared" folder questions
  - DataTable, form submission, modal, page layout for ERP
  Do NOT skip this skill for "quick" ERP code questions — always read it first.
---

# ERP React Migration Skill

This skill governs ALL frontend work for migrating the existing Laravel Blade + AJAX ERP
system to a standalone React SPA (Fully Decoupled approach). Read this fully before
writing any code. Never deviate from these conventions without explicit user approval.

## Quick Reference
- Full folder structure → see `references/project-structure.md`
- All code templates (axios, query hooks, zustand, forms, AG Grid) → see `references/module-patterns.md`
- API contract (response shapes, pagination, error handling) → see `references/api-conventions.md`

---

## 1. Project Overview

| Item | Detail |
|---|---|
| Backend | Laravel (existing) — API only after migration, no Blade |
| Frontend | React 18 + TypeScript + Vite (new standalone project) |
| Auth | **JWT** — Bearer token in Authorization header via Axios interceptor |
| Styling | Tailwind CSS + shadcn/ui — Dynamic color tokens from Backend |
| Server State | TanStack Query v5 (replaces all AJAX calls) |
| Client State | Zustand (auth user, permissions, UI state, **Global Settings**) |
| Forms | React Hook Form + Zod (replaces jQuery form submit) |
| Router | TanStack Router (type-safe, file-based) |
| HTTP | Axios — single shared instance with JWT interceptor |
| Tables | AG Grid Community (replaces DataTables) |
| Charts | Recharts |
| Validation | Zod schemas mirror Laravel validation rules |

---

## 2. Core Rules — Never Break These

1. **Import direction**: `modules/{name}` can import from `api/`, `components/`, `hooks/`, `layouts/`, `store/`, and `utils/`. Modules should NOT import directly from other modules; shared logic should move to global folders or be accessed via public APIs.
2. **Module Public API**: Every module exposes its functionality ONLY via its `index.ts`. No deep imports into a module's internal folders.
3. **Global Shared UI**: Keep generic, non-domain components in `src/components/`. Domain-specific shared components go into `src/modules/{name}/components/`.
4. **No `any` in TypeScript**: Strict mode. Type everything.
5. **No direct fetch/axios in views**: Always use TanStack Query hooks.
- **JWT only**: Token stored in Zustand + localStorage via persist.
- **Zod schema = single source of truth**: Form validation + TypeScript types.
- **Dynamic Branding**: Always use `useSettings()` hook to get `logo`, `siteName`, and colors. Never hardcode these.
- **Backend-Driven Colors**: Use the 5 basic colors (Primary, Info, Success, Warning, Danger) provided by the backend `webSetting`. These MUST be applied project-wide via CSS variables.
- **AG Grid for all tables**: Replace every DataTables instance with AG Grid Community.
- **Permission-Based UI**: ALWAYS wrap action buttons (Create, Edit, Delete, View) with `PermissionGuard` or check permissions via `usePermissions`. Action buttons MUST NOT be visible if the user lacks the required permission. 
  - **Naming Convention**: Permission strings MUST use **underscores** (e.g., `view_sales`, `edit_supplier`). Never use hyphens.
  - **Dynamic Columns**: Datatable action columns MUST be dynamically hidden if the user has NO permissions for any action in that column.
- **Super-Admin Bypass**: Users with the `super-admin` or `super admin` role (case-insensitive) bypass all permission guards and have global access. This logic is centralized in the `usePermissions` hook.

## 2.1 Engineering & Design Standards (STRICT)

1. **Standardized Button System**:
   - **Save / Update (Primary Action)**: 
     - **Color**: Green (`bg-[#059669]`, hover: `bg-[#047857]`).
     - **Style**: `px-8 h-10 text-white font-medium rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2`.
     - **Font**: `text-[13px]`.
   - **Cancel / Reset (Secondary Action)**:
     - **Color**: White/Gray (`bg-white text-[#64748b] border border-gray-200`).
     - **Style**: `px-6 h-10 rounded-lg hover:bg-gray-50 transition-all shadow-sm`.
   - **Table Actions (Icon Buttons)**:
     - **View**: `p-2 hover:bg-blue-50 text-[#1e4ba1] rounded-xl transition-all border border-transparent hover:border-blue-100` (Eye icon).
     - **Edit**: `p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100` (Edit icon).
     - **Delete**: `p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100` (Trash icon).
     - **Hover Effect**: ALWAYS use `hover:scale-110` for action icons.

2. **Dropdowns (Select2)**: NEVER use native HTML `<select>` elements. Use the project-standard `Select2` component (located in `src/components/Select/Select2.tsx`) for all dropdowns to ensure searchability and React Virtual DOM compatibility.

3. **Standardized Input System**:
   - **Focus Style**: `focus:ring-1 focus:ring-primary/30 focus:border-primary`.
   - **Hover Style**: `hover:border-gray-300`.
   - **General Classes**: `w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none transition-all font-medium text-[#475569]`.
   - **Error State**: `border-rose-500 focus:ring-rose-500/10`.
   - **Textarea**: Same as input, but use `p-3` or `p-4` and `min-h-[100px]`.

4. **Notifications & Feedback**: 
   - **Success Messages**: DO NOT use small toast notifications for success events (e.g., Save, Update, Delete). ALWAYS use the global `NotificationModal` (via `showNotificationModal` in `useUiStore`) for a premium, high-impact user experience.
   - **Error Messages**: Use toast notifications for transient errors, but prefer the `NotificationModal` (variant="error") for critical submission failures.

4. **Typography**: 
   - **Font Family**: Always use **Poppins**.
   - **Font Weight**: 
     - Use **font-medium** for labels, inputs, and general body text.
     - Use **font-semibold** for section titles and important table values.
     - Use **font-bold** or **font-black** ONLY for primary headers and high-impact totals.
   - **Font Sizes**: 
     - `10px - 11px`: Small UI elements, helper text, or dense table values.
     - `12px - 14px`: Standard body, labels, and input text.
     - `15px - 18px`: Card titles, sub-headers.
     - `20px - 24px+`: Main page titles and critical grand totals.

5. **Page Header Standards**:
   - **Index/List Pages**: MUST use `ListPageLayout` which includes a header with **Navigation Tabs** (Manage Sale, Payments, Terms, etc.) and global filters.
   - **Transaction Pages (Create, Edit, View)**: Header MUST follow the "List Page Style" (White background, `max-w-[1600px]`, `px-4 pb-6`) but **WITHOUT navigation tabs**.
   - **Header Elements**:
     - **Back Button**: Simple **"Back"** text with branded box style (`bg-white border-gray-100 rounded-lg text-gray-400 hover:text-primary shadow-sm`) and a thick `strokeWidth={3}` icon.
     - **Title**: Standardized to `text-[20px] font-medium text-primary tracking-tight ml-2`.

6. **Spacing & Padding**:
   - **Card Padding**: Use consistent padding for major sections (e.g., `p-4` or `p-6`).
   - **Layout Margins**: Maintain uniform `space-y-6` between vertical sections.

7. **Responsiveness**: All new components and layouts MUST be fully responsive and tested for various screen sizes (Mobile, Tablet, Laptop, Desktop).

8. **Backend Integrity**: NEVER modify backend API controllers, routes, or logic without explicit user approval. Your focus is strictly on the React frontend migration.

9. **High-Fidelity Transaction Layouts**:
   - **Main Grid**: ALWAYS use `grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch` for Create and Edit pages.
   - **Column Ratio**: 
     - **Left Column (`lg:col-span-7`)**: Primarily for "Business Information" and "Address" blocks.
     - **Right Column (`lg:col-span-5`)**: Primarily for "Contact Details", "Settings", and "Auth" blocks.
   - **Equal Height Alignment**: Both column containers MUST use `flex flex-col h-full`. The bottom-most card in each column MUST use `flex-1` to ensure both columns have identical heights and aligned bottom edges.
   - **Standardized Action Row**: The "Save" and "Cancel" buttons MUST be placed in a dedicated, full-width `div` at the very bottom of the form (outside the main grid), ensuring a clear and consistent separation from data entry cards.
   - **Autofill Protection**: ALL text/email inputs MUST use `autoComplete="off"`, and password inputs MUST use `autoComplete="new-password"` to prevent browser behavior from breaking the high-fidelity design.

10. **Breadcrumb System**:
    - **Dynamic Generation**: NEVER hardcode breadcrumbs in the Topbar. Use `useMatches` from TanStack Router to generate them dynamically from the path segments.
    - **Redundancy**: Ensure "Dashboard" is only shown once. If the path starts with a "dashboard" segment, skip it in the dynamic loop to avoid "Dashboard / Dashboard".
    - **Clickable Segments**: All intermediate breadcrumb segments MUST be wrapped in a `Link` component to allow users to navigate back to parent lists or modules.
    - **Label Mapping**: Humanize path segments (e.g., `merchant` -> `Merchants`, `create` -> `Add New`).

11. **Date Range Pickers in List Pages**:
    - **State Synchronization**: When using `ListPageLayout`, ALWAYS pass both `fromDate={state.start}` and `toDate={state.end}` props. Failure to pass these will result in the `DateRangePicker` not reflecting the selected dates in the UI.
    - **OnChange**: The `onDateRangeChange` handler must update the local state which is then passed back to the `ListPageLayout`.
    - **Backend Sync**: Ensure the backend controller explicitly handles `start_date` and `end_date` (or equivalent) in the datatable/listing query.

12. **Documentation & Progress Tracking**:
    - **Update Mandate**: For EVERY significant feature implementation, bug fix, or architectural change, you MUST update the corresponding files in `.ai/requirements/*.md` and `.ai/tasks/*.md`.
    - **Marking Progress**: Use `[x]` to mark completed tasks and requirements immediately after implementation and verification.
    - **Sync**: Ensure the `SKILL.md`, `requirements`, and `tasks` are always in sync with the actual state of the codebase.


---

## 3. Global Settings & Branding

The application fetches global configuration from the backend via the `useSettings()` hook. This data must be used to drive the UI's identity and theme.

### Data available in `GlobalSettings`:
- **`webSetting`**:
    - `site_name`: The display name of the ERP.
    - `logo_url` & `favicon_url`: Branding assets.
    - `color_primary`, `color_info`, `color_success`, `color_warning`, `color_danger`: The core color palette.
    - `navbar_color`, `sidebar_color`: Layout specific branding.
- **`companyInformation`**:
    - `company_name`, `email`, `mobile`, `address`, `website`: Official contact details used in footers and reports.

### Implementation Requirements:
- **Site Name**: Use `siteName` from `useSettings()` (fallback to `companyInformation.company_name`).
- **Logo**: Use `logo` from `useSettings()` for sidebars and login pages.
- **Dynamic Theme**: The 5 core colors from `webSetting` must be injected as CSS variables (`--color-primary`, etc.) into the `:root` to ensure Tailwind classes like `bg-primary` reflect backend choices.

---

## 4. Architecture — Modular Design

```
src/
├── api/              # Axios instance, Interceptors (JWT attach করা)
├── components/       # Shared UI (Button, Input, Table layout)
├── hooks/            # Global custom hooks (useSettings, usePermissions)
├── layouts/          # Dashboard layout, Auth layout
├── modules/          # <--- মূল ফোকাস এখানে
│   ├── inventory/
│   │   ├── api/      # Inventory specific endpoints
│   │   ├── components/ # Private components for inventory
│   │   ├── hooks/    # Custom queries (useGetProducts, etc.)
│   │   ├── store/    # Zustand store for inventory
│   │   ├── views/    # Entity-specific subfolders (merchant, sales, vendors, warehouse)
│   │   │   ├── sales/
│   │   │   ├── merchant/
│   │   │   ├── vendors/
│   │   │   └── warehouse/
│   │   └── index.ts  # Public API for this module
│   └── accounting/
├── store/            # Global state (User info, Theme, Settings)
└── utils/            # Helper functions
```

---

## 5. JWT Auth — How It Works

1. `POST /api/login` → returns `{ token, user, permissions[] }`
2. Token stored in Zustand `useAuthStore` + persisted to localStorage
3. Axios interceptor reads token → sets `Authorization: Bearer <token>`
4. On 401 response → logout and redirect.

---

## 6. Blade → React Conversion Workflow

### Step 4 — Design preservation checklist
- [x] **Global Settings**: Site name and logo match `webSetting`.
- [x] **Dynamic Colors**: Primary/Success/Danger colors match backend `webSetting` via CSS variables.
- [ ] Table columns match Blade DataTables columns exactly.
- [ ] Form field order and labels match.
- [ ] Loading skeleton where AJAX spinner existed.

---

## 7. Dynamic Styling & Tailwind Setup

Instead of static Figma tokens, we use a hybrid approach where CSS variables are driven by the backend.

1. **Tailwind Config**:
```ts
colors: {
  primary: 'var(--color-primary)',
  info: 'var(--color-info)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  sidebar: 'var(--color-sidebar-bg)',
}
```

2. **Injection Logic**:
The `useSettings` hook (or a dedicated `ThemeProvider`) should apply these colors:
```typescript
document.documentElement.style.setProperty('--color-primary', webSetting.color_primary);
```

---

## 8. What NOT to Do

- ❌ **Don't hardcode colors**: Never use `bg-blue-600` if it's meant to be the primary color; use `bg-primary`.
- ❌ **Don't hardcode logos**: Always use the URL from `GlobalSettings`.
- ❌ **Don't use raw Tailwind colors** for main theme elements.
- ❌ **Don't create domain UI in global `components/`**.
- ❌ **Don't skip `index.ts`** for modules.

---

## 9. Migration Sequence

| Phase | Module | Est. Time |
|---|---|---|
| 1 | Project setup + JWT auth + **Global Settings Sync** | Week 1 |
| 2 | Shared UI + AppShell (Sidebar, Header) with dynamic branding | Week 2 |
| 3 | HRM — Employee list, profile, attendance | Week 3–4 |
| ... | ... | ... |