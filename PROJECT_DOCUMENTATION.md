# Project Documentation: Genitech ERP React Migration

This document serves as a comprehensive record of the architecture, tech stack, and foundational setup for the Genitech ERP frontend migration project.

## 1. Project Architecture

The project follows a **Modular Architecture** designed for scalability and clear domain separation. Unlike traditional Feature-Sliced Design (FSD), this approach prioritizes self-contained modules while providing robust global infrastructure.

### Folder Structure Overview
```text
erp_frontend/
├── src/
│   ├── api/              # Global API client, Interceptors, Query Providers
│   ├── components/       # Global UI components (Generic only)
│   ├── hooks/            # Global custom hooks (Permissions, Utils)
│   ├── layouts/          # Layout wrappers (AppShell, AuthGuard)
│   ├── modules/          # DOMAIN MODULES (Inventory, Accounting, HRM)
│   │   ├── [module-name]/
│   │   │   ├── api/      # Module-specific API hooks & types
│   │   │   ├── components/ # Private UI components
│   │   │   ├── hooks/    # Validation and business logic hooks
│   │   │   ├── store/    # Module-specific Zustand store
│   │   │   └── views/    # Main page/route components
│   ├── store/            # Global Zustand stores (Auth, UI)
│   ├── utils/            # Helper functions & formatters
│   ├── assets/           # Global styles & assets
│   └── main.tsx          # Application entry point
```

---

## 2. Core Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | React 18 (TypeScript) + Vite |
| **Styling** | Tailwind CSS v4 + PostCSS |
| **State (Client)** | Zustand (with Persist middleware) |
| **State (Server)** | TanStack Query v5 |
| **Routing** | TanStack Router |
| **Forms** | React Hook Form + Zod |
| **HTTP Client** | Axios (with interceptors) |
| **Data Tables** | AG Grid Community |
| **Icons** | Lucide React |

---

## 3. Foundational Implementation

### Global Infrastructure
- **API Client**: `src/api/client.ts` configured with a base URL from `.env` and request interceptors to automatically attach JWT Bearer tokens.
- **Query Provider**: `src/api/QueryProvider.tsx` setup for global server-state management.
- **Path Aliases**: `@/` configured in `vite.config.ts` and `tsconfig.json` to point to the `src/` directory.

### Global State Management
- **Auth Store**: `src/store/useAuthStore.ts` handles user session, JWT persistence in `localStorage`, and permission tracking.
- **UI Store**: `src/store/useUiStore.ts` provides a global notification/toast system.

### Styling & Design Tokens
- **Tailwind v4**: Configured with the new `@import "tailwindcss"` engine.
- **Semantic Tokens**: CSS variables defined for primary colors, sidebar background, and common border styles in `src/assets/styles/globals.css`.
- **Base Components**: Custom CSS classes like `.erp-input` and `.erp-btn-primary` established for UI consistency.

---

## 4. Development Workflow

1.  **Module Creation**: Every new module (e.g., Inventory) should follow the internal structure defined in Section 1.
2.  **API Integration**: Use TanStack Query hooks within the module's `api` folder; never use Axios directly in components.
3.  **Path Aliases**: Always use `@/` for imports from the `src` directory to maintain clean and movable code.
4.  **Verification**: Ensure all code passes TypeScript strict checks and builds successfully using `npm run build`.

---

## 5. Current Progress (Phase 1 & 2)
- [x] Project Scaffolding (Vite + TS)
- [x] Tailwind CSS v4 Configuration
- [x] Core Dependency Installation
- [x] Global API Client & Stores Implementation
- [x] Directory Structure Establishment
- [x] Build Verification (Successful)
- [x] AuthLayout & LoginPage Implementation (Phase 2)
- [x] AppShell, Sidebar, & Topbar Implementation (Phase 2)
- [x] Route Protection (AuthGuard & PermissionGuard) (Phase 2)
- [x] Dashboard Module Foundation (Phase 2)
- [x] TanStack Router setup & Route generation
- [x] Global Toast Notification System (Phase 1)
- [x] Login System Error Handling (Phase 2)
