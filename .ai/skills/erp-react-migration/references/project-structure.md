# Project Structure — Full Folder Tree

Complete folder and file structure for `erp-frontend/`.
Read this when setting up a new module or checking where a file belongs.

---

## Full Tree

```
erp-frontend/
├── .env                              ← VITE_API_URL, VITE_APP_NAME
├── .env.production
├── index.html
├── vite.config.ts                    ← path alias: @/ → src/
├── tailwind.config.ts                ← Figma color tokens mapped here
├── tsconfig.json                     ← strict: true, no implicit any
├── package.json
│
└── src/
    ├── api/                          ← GLOBAL API LAYER
    │   ├── client.ts                 ← Axios instance with JWT interceptor
    │   └── types.ts                  ← ApiResponse<T>, PaginatedResponse<T>
    │
    ├── components/                   ← GLOBAL SHARED UI (generic only)
    │   ├── Button/
    │   ├── DataTable/                ← AG Grid wrapper
    │   ├── Form/                     ← FormField, FormError wrappers
    │   ├── Modal/
    │   ├── PageHeader/
    │   └── Spinner/
    │
    ├── hooks/                        ← GLOBAL CUSTOM HOOKS
    │   ├── useDebounce.ts
    │   ├── usePagination.ts
    │   └── usePermission.ts          ← usePermission('inventory.write')
    │
    ├── layouts/                      ← LAYOUT LAYER
    │   ├── AppShell/                 ← Main Sidebar + Header layout
    │   ├── AuthLayout/               ← Login page layout
    │   └── DashboardLayout/
    │
    ├── modules/                      ← MODULE LAYER (Primary Domain Logic)
    │   ├── inventory/
    │   │   ├── index.ts              ← Public API for this module
    │   │   ├── api/                  ← Inventory specific endpoints + keys
    │   │   │   ├── inventory.api.ts
    │   │   │   ├── inventory.keys.ts
    │   │   │   └── types.ts
    │   │   ├── components/           ← Private components for inventory
    │   │   │   ├── ProductForm.tsx
    │   │   │   └── StockAdjustmentModal.tsx
    │   │   ├── hooks/                ← Custom queries + validation
    │   │   │   ├── useProducts.ts
    │   │   │   └── validation.ts
    │   │   ├── store/                ← Zustand store for inventory
    │   │   │   └── useInventoryStore.ts
    │   │   └── views/                ← Main pages (ProductList, StockEntry)
    │   │       ├── ProductListPage.tsx
    │   │       └── ProductDetailPage.tsx
    │   │
    │   ├── accounting/
    │   │   ├── index.ts
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── store/
    │   │   └── views/
    │   │
    │   └── hrm/                      ← Human Resource Management
    │
    ├── store/                        ← GLOBAL STATE (Shared)
    │   ├── useAuthStore.ts           ← user, token, permissions, login
    │   └── useUiStore.ts             ← sidebar state, notifications
    │
    ├── utils/                        ← HELPER FUNCTIONS
    │   ├── formatDate.ts
    │   ├── formatCurrency.ts         ← BDT formatting (৳ symbol)
    │   └── validators.ts
    │
    ├── assets/                       ← ASSETS & GLOBAL STYLES
    │   ├── images/
    │   └── styles/
    │       └── globals.css           ← Tailwind imports + Figma CSS vars
    │
    └── main.tsx                      ← App Entry point
```

---

## vite.config.ts — Path Alias Setup

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## tsconfig.json — Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2020"
  }
}
```
