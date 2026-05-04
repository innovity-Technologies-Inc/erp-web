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
| Styling | Tailwind CSS + shadcn/ui — color tokens imported from Figma |
| Server State | TanStack Query v5 (replaces all AJAX calls) |
| Client State | Zustand (auth user, permissions, UI state) |
| Forms | React Hook Form + Zod (replaces jQuery form submit) |
| Router | TanStack Router (type-safe, file-based) |
| HTTP | Axios — single shared instance with JWT interceptor |
| Tables | AG Grid Community (replaces DataTables) |
| Charts | Recharts |
| Validation | Zod schemas mirror Laravel validation rules |

---

## 2. Core Rules — Never Break These

1. **Import direction**: `modules/{name}` can import from `api/`, `components/`, `hooks/`, `layouts/`, `store/`, and `utils/`. Modules should NOT import directly from other modules; shared logic should move to global folders or be accessed via public APIs.
2. **Module Public API**: Every module exposes its functionality ONLY via its `index.ts`. No deep imports into a module's internal folders (e.g., `import { X } from '@/modules/inventory/views/Y'`).
3. **Global Shared UI**: Keep generic, non-domain components in `src/components/`. Domain-specific shared components go into `src/modules/{name}/components/`.
4. **Module isolation**: Each module should be self-contained as much as possible, containing its own API calls, state, and views.
5. **No `any` in TypeScript**: Strict mode. Type everything. Use `unknown` + narrowing if needed.
6. **No direct fetch/axios in views**: Always use TanStack Query hooks defined in the module's `api/` or `hooks/` folder.
7. **JWT only**: Never Sanctum cookies. Token stored in Zustand + localStorage via persist. Authorization header set in Axios interceptor.
8. **Zod schema = single source of truth**: Form validation + TypeScript types both come from the Zod schema. No duplicate type definitions.
9. **Design from Figma**: CSS variables from Figma color styles go into `tailwind.config.ts`. Never use raw Tailwind color classes like `bg-blue-500` — always use semantic tokens like `bg-primary`.
10. **AG Grid for all tables**: Replace every DataTables instance with AG Grid Community + server-side datasource.

---

## 3. Architecture — Modular Design

```
src/
├── api/              # Axios instance, Interceptors (JWT attach করা)
├── components/       # Shared UI (Button, Input, Table layout)
├── hooks/            # Global custom hooks
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
├── store/            # Global state (User info, Theme)
└── utils/            # Helper functions
```

Layer rules:
- **Global folders** (`api/`, `components/`, etc.) provide shared infrastructure.
- **Modules** contain feature-specific logic and are the primary building blocks.
- **Modules** can use **Global** resources, but **Global** resources must never depend on **Modules**.

---

## 4. JWT Auth — How It Works

Unlike Sanctum (cookie), this project uses JWT Bearer tokens.

**Flow:**
1. `POST /api/login` → returns `{ token, user, permissions[] }`
2. Token stored in Zustand `useAuthStore` (in `src/store/`) + persisted to localStorage
3. Axios interceptor (in `src/api/`) reads token from store → sets `Authorization: Bearer <token>` on every request
4. On 401 response → interceptor clears store → redirects to `/login`
5. TanStack Router `AuthGuard` → checks `useAuthStore.user` → redirects if null

**Token refresh (if Laravel Passport/JWT refresh is available):**
- On 401 → try `POST /api/auth/refresh` with current token
- If refresh succeeds → retry original request with new token
- If refresh fails → logout

Full code templates in `references/module-patterns.md` → Section 1 (Axios JWT Client).

---

## 5. Blade → React Conversion Workflow

When given a Blade file to convert, follow these steps in order:

### Step 1 — Analyze the Blade file
- What data does the controller pass to the view?
- What AJAX calls exist (`$.ajax`, `$.get`, `$.post`, `fetch`)? Map each to a `useQuery` or `useMutation`
- What form submissions exist? → `useMutation` + React Hook Form + Zod
- What DataTables instances exist? → AG Grid with server-side datasource
- Which CSS classes are used? Map to Tailwind equivalents or keep as-is

### Step 2 — Determine placement
```
Full page view?              → modules/{module}/views/XxxPage.tsx
Module-specific component?   → modules/{module}/components/
Reusable domain logic/hook?  → modules/{module}/hooks/
Module API/State?            → modules/{module}/api/ or /store/
Pure generic UI?             → components/
```

### Step 3 — Create files in this order
1. `types.ts` — TypeScript interfaces (usually in `modules/{module}/api/` or a dedicated types file)
2. `{module}.keys.ts` — QueryKey factory (in `modules/{module}/api/`)
3. `{module}.api.ts` — TanStack Query hooks (in `modules/{module}/api/`)
4. `validation.ts` — Zod schema (in `modules/{module}/hooks/` or `components/`)
5. `use{Action}.ts` — Business logic hook (in `modules/{module}/hooks/`)
6. UI components (in `modules/{module}/components/`)
7. `index.ts` — Export only public API for the module
8. Main views (in `modules/{module}/views/`)

### Step 4 — Design preservation checklist
- [ ] Colors from Figma/Blade CSS → Tailwind tokens match
- [ ] Table columns match Blade DataTables columns exactly
- [ ] Form field order and labels match
- [ ] Button positions and styles match
- [ ] Loading skeleton where AJAX spinner existed
- [ ] Error messages match Laravel validation messages

---

## 6. AJAX → TanStack Query Mapping

| Old Blade pattern | New React pattern |
|---|---|
| `$.ajax({ type: 'GET' })` → DataTable render | `useQuery` → AG Grid `rowData` |
| `$.ajax({ type: 'POST' })` → success callback | `useMutation` → `onSuccess` invalidate |
| `$.ajax({ type: 'PUT/PATCH' })` | `useMutation` PUT/PATCH |
| `$.ajax({ type: 'DELETE' })` → reload | `useMutation` → `invalidateQueries` |
| DataTables server-side AJAX | AG Grid `IServerSideDatasource` + `useInfiniteQuery` or manual pagination |
| jQuery form serialize | `react-hook-form` `handleSubmit` |
| Laravel 422 errors → show div | `form.setError` from `err.response.data.errors` |
| AJAX success notification | `useUiStore().notify('msg', 'success')` |

---

## 7. Figma → Tailwind Token Setup

When starting a new module or setting up the project:

1. Export Figma color styles as CSS variables (Figma → Tokens plugin or manual)
2. Add to `src/assets/styles/globals.css` (or wherever global styles are kept):
```css
:root {
  --color-primary: #1a56db;        /* from Figma "Primary" style */
  --color-primary-hover: #1a46bb;
  --color-danger: #e02424;
  --color-success: #057a55;
  --color-warning: #c27803;
  --color-sidebar-bg: #1e2a3b;     /* from Figma sidebar */
  --color-sidebar-text: #9ca3af;
  --color-border: #e5e7eb;
  /* add all Figma color styles here */
}
```
3. Reference in `tailwind.config.ts`:
```ts
colors: {
  primary: 'var(--color-primary)',
  danger: 'var(--color-danger)',
  success: 'var(--color-success)',
  sidebar: { bg: 'var(--color-sidebar-bg)', text: 'var(--color-sidebar-text)' },
}
```
4. Now use `bg-primary`, `text-danger`, `bg-sidebar-bg` everywhere — never raw hex.

---

## 8. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component files | PascalCase | `ProductListTable.tsx` |
| Hook files | camelCase with `use` prefix | `useProducts.ts` |
| API files | camelCase with `.api.ts` | `product.api.ts` |
| Query key files | camelCase with `.keys.ts` | `product.keys.ts` |
| Type files | `types.ts` per module | `types.ts` |
| Folder names | kebab-case | `inventory/`, `accounting/` |
| Query keys | array starting with module | `['inventory', 'products', filters]` |
| Route constants | object with dot notation | `ROUTES.inventory.products` |
| Zustand stores | `use` + PascalCase + `Store` | `useAuthStore`, `useUiStore` |
| Zod schemas | camelCase + `Schema` suffix | `addProductSchema` |
| DTO types | PascalCase + `Dto` suffix | `CreateProductDto` |
| Inferred form types | PascalCase + `FormValues` | `AddProductFormValues` |

---

## 9. Module Checklist (use when building a new module)

For each new module (e.g., Inventory, Accounting, HRM):

```
modules/{name}/
  ├── index.ts          ← export views + hooks (public API)
  ├── api/              ← API hooks, keys, types
  │   ├── {name}.api.ts
  │   ├── {name}.keys.ts
  │   └── types.ts
  ├── components/       ← Private UI for this module
  │   ├── {Feature}Form.tsx
  │   └── {Feature}Modal.tsx
  ├── hooks/            ← Module-specific hooks (validation, logic)
  │   ├── use{Feature}.ts
  │   └── validation.ts
  ├── store/            ← Module-specific Zustand store (if needed)
  │   └── use{Name}Store.ts
  └── views/            ← Main pages/views
      ├── {Name}ListPage.tsx
      └── {Name}DetailPage.tsx
```

---

## 10. What NOT to Do

- ❌ Don't install Redux — Zustand is decided
- ❌ Don't use React Router — TanStack Router is decided
- ❌ Don't fetch/axios in views — always go through TanStack Query hooks
- ❌ Don't hardcode API URLs — always `import.meta.env.VITE_API_URL`
- ❌ Don't use Sanctum cookies — JWT Bearer only
- ❌ Don't store JWT in sessionStorage — Zustand persist → localStorage
- ❌ Don't create domain UI in global `components/` — global is generic only
- ❌ Don't import between modules directly — modules should be isolated
- ❌ Don't skip `index.ts` — every module must have a public API file
- ❌ Don't use `any` TypeScript — type everything
- ❌ Don't use raw Tailwind colors (`bg-blue-500`) — use Figma-mapped tokens
- ❌ Don't write duplicate type definitions — derive from Zod schema with `z.infer<>`
- ❌ Don't use DataTables — AG Grid for all tables
- ❌ Don't reinvent — always check global `components/` before creating a new component

---

## 11. Migration Sequence (phase order)

| Phase | Module | Est. Time |
|---|---|---|
| 1 | Project setup + JWT auth (Login, AuthGuard, token refresh) | Week 1 |
| 2 | Shared UI + AppShell (Sidebar, Header, Layout) + Dashboard | Week 2 |
| 3 | HRM — Employee list, profile, attendance | Week 3–4 |
| 4 | HRM — Payroll, leave management | Week 4–5 |
| 5 | Inventory — Products, categories, stock | Week 5–6 |
| 6 | Inventory — Purchase orders (complex multi-line form) | Week 6–7 |
| 7 | Accounts — Chart of accounts, journal entry | Week 7–8 |
| 8 | Accounts — Reports, PDF/Excel export | Week 8–9 |
| 9 | Testing (Vitest + Playwright) + Production deploy | Week 9 |

Complete one phase fully (with working routes + tests) before starting the next.