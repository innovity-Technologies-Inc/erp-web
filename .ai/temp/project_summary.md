# Project Overview: ERP React Migration

This document summarizes the core tech stack and the modular project structure for the ERP migration from Laravel Blade to React.

## 1. Core Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 (TypeScript) + Vite |
| **Styling** | Tailwind CSS + shadcn/ui (Figma-based design tokens) |
| **State Management (Client)** | Zustand (Auth, UI, and Module-specific state) |
| **State Management (Server)** | TanStack Query v5 (Data fetching and caching) |
| **Routing** | TanStack Router (Type-safe, file-based) |
| **Form Handling** | React Hook Form + Zod |
| **HTTP Client** | Axios (with JWT interceptor) |
| **Data Tables** | AG Grid Community |
| **Icons & Charts** | Lucide React / Recharts |
| **Auth** | JWT (Bearer Token stored in Zustand + LocalStorage) |

---

## 2. Project Folder Structure

The project follows a **Modular Architecture** to ensure isolation and scalability.

```text
erp_frontend/
├── src/
│   ├── api/              # Global Axios instance and interceptors (JWT logic)
│   ├── components/       # Shared UI components (Button, Input, Table layout)
│   ├── hooks/            # Global custom hooks (usePermission, useDebounce)
│   ├── layouts/          # Layout wrappers (AppShell, AuthLayout)
│   ├── modules/          # PRIMARY DOMAIN LOGIC
│   │   ├── inventory/
│   │   │   ├── api/      # Inventory-specific API hooks and types
│   │   │   ├── components/ # Private components for inventory features
│   │   │   ├── hooks/    # Custom queries and validation logic
│   │   │   ├── store/    # Module-specific Zustand store
│   │   │   ├── views/    # Page components (ProductList, StockEntry)
│   │   │   └── index.ts  # Public API for the module
│   │   ├── accounting/
│   │   └── hrm/
│   ├── store/            # Global Zustand stores (AuthStore, UiStore)
│   ├── utils/            # Helper functions (Formatters, Validators)
│   ├── assets/           # Global styles and static images
│   ├── main.tsx          # App entry point
│   └── App.tsx           # Providers and Router setup
├── tailwind.config.ts    # Design tokens from Figma
├── vite.config.ts        # Path aliases (@/ -> src/)
└── tsconfig.json         # Strict TypeScript configuration
```

---

## 3. Core Architectural Rules

1.  **Module Isolation**: Modules should not import directly from other modules. Shared logic belongs in the global folders (`src/api`, `src/components`, etc.).
2.  **Public API**: Access module functionality only through its `index.ts`. No deep imports into module internals.
3.  **Global vs Local**: Generic UI goes in `src/components/`. Domain-specific UI goes in `src/modules/{name}/components/`.
4.  **Data Fetching**: Never use Axios directly in views. Always wrap requests in TanStack Query hooks within the module's `api` folder.
5.  **JWT Auth**: Bearer token is automatically attached to requests by the global interceptor in `src/api/client.ts`.
