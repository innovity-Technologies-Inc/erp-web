# ERP System Architecture & Development Workflow

This document provides a comprehensive "A to Z" guide of the technical architecture and development processes for the ERP React SPA.

---

## 1. Authentication & Authorization (JWT)
The system uses a stateless JWT (JSON Web Token) approach for security.

### Core Workflow:
- **Login**: `POST /api/login` receives credentials and returns `{ token, user, permissions }`.
- **Storage**: The token and user data are stored in **Zustand (`useAuthStore`)**. We use `persist` middleware to sync this with `localStorage` automatically.
- **Interception**: All requests are routed through `src/api/client.ts`. An Axios interceptor automatically attaches the `Authorization: Bearer <token>` header to every outgoing request.
- **Session Expiry**: If a `401 Unauthorized` response is received, the system clears the local store and redirects the user to the login page immediately.

---

## 2. Permission System (RBAC)
We implement Role-Based Access Control (RBAC) at the UI level to match backend constraints.

### Key Components:
- **`usePermissions` Hook**: A centralized hook that checks if a user has a specific permission string (e.g., `view_sales`). It includes logic to bypass all checks for users with the `super-admin` role.
- **`PermissionGuard` Component**: A wrapper used in views.
    ```tsx
    <PermissionGuard permission="create_product">
        <button>Add New</button>
    </PermissionGuard>
    ```
- **Dynamic Tables**: In AG Grid, we use the permission hook to show or hide entire "Action" columns or specific buttons (View/Edit/Delete).

---

## 3. Data Flow & API Pattern
We follow a strict **Separation of Concerns** using a three-tier data layer.

### Tier 1: API Functions (`src/modules/{module}/api/`)
Pure asynchronous functions that handle the HTTP request/response logic.
- **Standard**: Always return `ApiResponse<T>` or `DataTablesResponse<T>`.

### Tier 2: Query Hooks (`src/modules/{module}/hooks/`)
Wrappers using **TanStack Query (v5)**.
- **`useQuery`**: For fetching data (cached, auto-refetched).
- **`useMutation`**: For operations like Create, Update, or Delete. This tier handles query invalidation (refreshing lists after a save).

### Tier 3: Views (`src/modules/{module}/views/`)
React components that consume the hooks.
- **Rule**: Views NEVER call Axios directly. They only use hooks to ensure "Server State" is managed correctly (Loading/Error/Data).

---

## 4. Form Management & Validation
- **Engine**: **React Hook Form**. It provides high performance by minimizing re-renders.
- **Validation**: **Zod Schemas**. Every form has a schema in `validation.ts` that matches backend requirements.
- **Complex Data**: We use `useFieldArray` for dynamic line items (like Sale/Purchase rows).

---

## 5. UI & Design Standards (High-Fidelity)
To maintain a premium look, we strictly adhere to:

- **Typography**: **Poppins** font family used throughout the application.
- **Tables**: **AG Grid Community**. Replaces standard HTML tables for powerful filtering, sorting, and pinning.
- **Dropdowns**: **Select2** component. We never use native `<select>` to ensure a unified, searchable dropdown experience.
- **Rich Text**: **RichEditor** component for descriptions and notes.
- **Standard Layouts**:
    - `ListPageLayout`: For index pages with tabs and filters.
      - **Report Layouts**: Use `customHeaderRight`, `toolbarRightExtra`, and `summaryFooter` for highly specialized report views.
      - **Total Summaries**: **NEVER** use AG Grid's native `pinnedBottomRowData` for `autoHeight` tables, as it causes layout collapse. Always calculate the total dynamically on the frontend and render it within `ListPageLayout`'s `summaryFooter` slot for perfect alignment with the pagination bar.
    - `grid-cols-12`: Standardized grid ratios for Create/Edit pages.

---

## 6. Dynamic Branding & Theming
The UI is not hardcoded; it is driven by the backend `webSetting`.

- **Colors**: 5 core color tokens (Primary, Info, Success, Warning, Danger) are fetched via `useSettings()`.
- **CSS Variables**: These colors are injected into the `:root` as CSS variables, allowing Tailwind classes like `bg-primary` to dynamically reflect backend branding.
- **Assets**: Logos and Site Names are pulled from global settings to ensure the white-labeling capability of the ERP.

---

## 8. Directory & File Structure Breakdown

### ── Root `src/` Folders ──

#### `src/api/`
Handles global HTTP configuration and shared data types.
- **`client.ts`**: The core Axios instance with JWT interceptors (attaches tokens, handles 401 logouts).
- **`types.ts`**: Global TypeScript interfaces for API responses (`ApiResponse`, `PaginatedResponse`, `DataTablesResponse`).
- **`QueryProvider.tsx`**: Sets up the TanStack Query client for the entire application.
- **`settings.api.ts`**: Fetches global web settings and company information from the backend.

#### `src/hooks/`
Global custom hooks used throughout the application.
- **`useSettings.ts`**: Reactive hook to access branding (logo, colors, site name) and apply dynamic themes.
- **`usePermissions.ts`**: Logic for checking user abilities and roles (`super-admin` bypass).

#### `src/utils/`
Global helper functions.
- **`formatters.ts`**: Standardized functions for currency formatting, date strings, and numeric parsing.
- **`exportUtils.ts`**: Logic for exporting table data to CSV/Excel.

#### `src/routes/`
The folder-based routing structure (TanStack Router).
- **`__root.tsx`**: The main layout wrapper that defines the app's global shell (Sidebar + Header).
- **`_authenticated.tsx`**: The guard layout that ensures a user is logged in before rendering child pages.
- **`_auth.tsx`**: Layout for guest-only pages (Login, Forgot Password).
- **`routeTree.gen.ts`**: (Generated) The auto-updated tree of all valid paths in the application. Never edit this manually.

---

### ── Module Structure (`src/modules/{module}/`) ──

Every feature (e.g., Inventory, Accounting) is isolated into its own module folder to ensure scalability.

#### `api/` (Module Level)
Contains feature-specific endpoint definitions.
- *Example*: `sales.api.ts` contains `getSalesDatatable` and `createSale`.
- **Purpose**: Keeps the actual HTTP URLs and payloads outside of the UI components.

#### `hooks/` (Module Level)
Contains TanStack Query hooks and validation logic.
- **`use{Name}.ts`**: Wraps the API functions in `useQuery` or `useMutation`.
- **`validation.ts`**: The single source of truth for the module's Zod schemas and TypeScript form types.

#### `views/` (Module Level)
Contains the actual React components (Pages) for the module.
- Organized by entity: `sales/`, `products/`, `merchants/`, etc.
- Standard pattern: `ListPage.tsx`, `CreatePage.tsx`, `EditPage.tsx`, `DetailsPage.tsx`.

#### `index.ts` (Module Public API)
The gatekeeper for the module.
- **Role**: It exports only what is needed by the rest of the application (Pages, Hooks, API functions).
- **Import Rule**: The rest of the app imports from `@/modules/inventory` rather than deep-diving into its folders.

---

## 9. Development Life-Cycle
1. **Define Schema**: Create a Zod schema in `validation.ts`.
2. **Define API**: Add endpoints to the module's `.api.ts` file.
3. **Define Hooks**: Create TanStack Query hooks in the module's `use{Name}.ts`.
4. **Build View**: Use `ListPageLayout` for lists or standardized cards for forms.
5. **Register Route**: Add the page to the TanStack Router tree in `src/routes/`.
6. **Export**: Export the view via the module's `index.ts`.

---


This architecture ensures that the system is **scalable**, **type-safe**, and provides a **premium user experience** consistent with global software standards.
