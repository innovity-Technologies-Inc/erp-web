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
- **Permission-Based UI**: ALWAYS wrap action buttons (Create, Edit, Delete, View) with `PermissionGuard` or check permissions via `usePermissions`. Action buttons MUST NOT be visible if the user lacks the required permission. Use the `createPermission`, `editPermission`, `deletePermission` patterns.
- **Super-Admin Access**: Users with the `Super-Admin` role (checked in `usePermissions`) have global access and bypass all permission guards. This is a project-wide standard.

## 2.1 Engineering & Design Standards (STRICT)

1. **Dropdowns (Select2)**: NEVER use native HTML `<select>` elements. Use the project-standard `Select2` component (located in `src/components/Select/Select2.tsx`) for all dropdowns to ensure searchability and React Virtual DOM compatibility.
2. **Notifications**: DO NOT use small toast notifications for success or critical error messages. ALWAYS use the global `NotificationModal` (via `showNotificationModal` in `useUiStore`) for a premium, high-impact user experience.
3. **Typography**: 
   - **Font Family**: Always use **Poppins**.
   - **Font Sizes**: Strictly follow project standards (e.g., 10px-12px for small UI elements, 14px-16px for body/inputs, 20px+ for headers).
4. **Responsiveness**: All new components and layouts MUST be fully responsive and tested for various screen sizes (Mobile, Tablet, Laptop, Desktop).
5. **Backend Integrity**: NEVER modify backend API controllers, routes, or logic without explicit user approval. Your focus is strictly on the React frontend migration.

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
│   │   ├── views/    # Main pages (ProductList, StockEntry)
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