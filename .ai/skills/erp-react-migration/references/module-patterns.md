# Module Patterns — Full Code Templates

Copy-paste ready templates for every recurring pattern in the ERP project.
Read this file for concrete code. SKILL.md explains the why; this file shows the how.

---

## Table of Contents
1. Axios Client with JWT Interceptor
2. Shared API Types
3. QueryKey Factory
4. Module API Hooks (CRUD)
5. Zustand Auth Store (JWT)
6. Zustand UI Store (notifications, sidebar)
7. Permission Hook
8. Auth Guard + Permission Guard
9. Zod Validation Schema
10. Feature Hook (business logic)
11. Feature Form Component
12. AG Grid DataTable Wrapper
13. Page Component Pattern
14. Module index.ts (public API)
15. Laravel 422 Error Mapping
16. BDT Currency + Date Formatters
17. AppShell Layout Component
18. TanStack Query Provider

---

## 1. Axios Client with JWT Interceptor
**File:** `src/api/client.ts`

```typescript
import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally — try refresh, then logout
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!))
  failedQueue = []
}

apiClient.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return apiClient(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        // Attempt token refresh (if your Laravel has refresh endpoint)
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } }
        )
        const newToken = data.data.token
        useAuthStore.getState().setToken(newToken)
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().clearUser()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)
```

---

## 2. Shared API Types
**File:** `src/api/types.ts`

```typescript
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  links: {
    first: string | null
    last:  string | null
    prev:  string | null
    next:  string | null
  }
}

export interface ValidationErrorResponse {
  success: false
  message: string
  errors: Record<string, string[]>
}
```

---

## 3. QueryKey Factory
**File:** `src/modules/inventory/api/inventory.keys.ts`

```typescript
import type { ProductFilters } from './types'

export const inventoryKeys = {
  all:      ()              => ['inventory']                       as const,
  products: ()              => [...inventoryKeys.all(), 'products'] as const,
  list:     (f: ProductFilters) => [...inventoryKeys.products(), 'list', f] as const,
  detail:   (id: number)    => [...inventoryKeys.products(), 'detail', id] as const,
}
```

---

## 4. Module API Hooks (CRUD)
**File:** `src/modules/inventory/api/inventory.api.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { ApiResponse, PaginatedResponse } from '@/api/types'
import { inventoryKeys } from './inventory.keys'
import type { Product, ProductFilters, CreateProductDto } from './types'

// LIST — server-side paginated (AG Grid compatible)
export const useProducts = (filters: ProductFilters) =>
  useQuery({
    queryKey: inventoryKeys.list(filters),
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Product>>('/products', { params: filters })
        .then(r => r.data),
    staleTime: 30_000,
  })

// SINGLE
export const useProduct = (id: number) =>
  useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () =>
      apiClient
        .get<ApiResponse<Product>>(`/products/${id}`)
        .then(r => r.data.data),
    enabled: !!id,
  })

// CREATE
export const useCreateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProductDto) =>
      apiClient
        .post<ApiResponse<Product>>('/products', dto)
        .then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.products() })
    },
  })
}
```

---

## 5. Zustand Auth Store (JWT)
**File:** `src/store/useAuthStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/api/client'

interface User { id: number; name: string; email: string; role: string }

interface AuthState {
  user:        User | null
  token:       string | null
  permissions: string[]
  isLoading:   boolean
  login:       (email: string, password: string) => Promise<void>
  logout:      () => Promise<void>
  setToken:    (token: string) => void
  clearUser:   () => void
  hasPermission:    (perm: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:        null,
      token:       null,
      permissions: [],
      isLoading:   false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await apiClient.post('/auth/login', { email, password })
          set({
            token:       data.data.token,
            user:        data.data.user,
            permissions: data.data.permissions,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        try {
          await apiClient.post('/auth/logout')
        } finally {
          set({ user: null, token: null, permissions: [] })
        }
      },

      setToken: (token) => set({ token }),
      clearUser: () => set({ user: null, token: null, permissions: [] }),
      hasPermission: (perm) => get().permissions.includes(perm),
    }),
    {
      name: 'erp-auth',
      partialize: (s) => ({ token: s.token, user: s.user, permissions: s.permissions }),
    }
  )
)
```

---

## 6. Zustand UI Store
**File:** `src/store/useUiStore.ts`

```typescript
import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification { id: string; message: string; type: NotificationType }

interface UiState {
  sidebarOpen:   boolean
  notifications: Notification[]
  toggleSidebar: () => void
  notify:        (message: string, type?: NotificationType) => void
  dismissNotify: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen:   true,
  notifications: [],
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  notify: (message, type = 'info') => {
    const id = crypto.randomUUID()
    set(s => ({ notifications: [...s.notifications, { id, message, type }] }))
    setTimeout(() => {
      set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }))
    }, 4000)
  },
  dismissNotify: (id) => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
}))
```

---

## 7. Permission Hook
**File:** `src/hooks/usePermission.ts`

```typescript
import { useAuthStore } from '@/store/useAuthStore'

export const usePermission = (permission: string): boolean =>
  useAuthStore(s => s.hasPermission(permission))
```

---

## 8. Auth Guard + Permission Guard
**File:** `src/layouts/guards.tsx`

```tsx
import { Navigate, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/store/useAuthStore'

export const AuthGuard = () => {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" />
  return <Outlet />
}

interface PermGuardProps {
  permission: string
  fallback?:  React.ReactNode
  children:   React.ReactNode
}

export const PermissionGuard = ({ permission, fallback, children }: PermGuardProps) => {
  const can = useAuthStore(s => s.hasPermission(permission))
  if (!can) return fallback ? <>{fallback}</> : <div className="erp-forbidden">Access Denied</div>
  return <>{children}</>
}
```

---

## 9. Zod Validation Schema
**File:** `src/modules/inventory/hooks/validation.ts`

```typescript
import { z } from 'zod'

export const addProductSchema = z.object({
  name:        z.string().min(2, 'Name must be at least 2 characters'),
  sku:         z.string().min(1, 'SKU is required'),
  category_id: z.number({ required_error: 'Please select a category' }),
  unit_price:  z.number().positive('Price must be positive'),
  stock_qty:   z.number().int().min(0),
  unit:        z.enum(['pcs', 'kg', 'box']),
})

export type AddProductFormValues = z.infer<typeof addProductSchema>
```

---

## 10. Feature Hook (Business Logic)
**File:** `src/modules/inventory/hooks/useAddProduct.ts`

```typescript
import type { UseFormSetError } from 'react-hook-form'
import { useCreateProduct } from '../api/inventory.api'
import { useUiStore } from '@/store/useUiStore'
import type { AddProductFormValues } from './validation'

export const useAddProduct = (setError: UseFormSetError<AddProductFormValues>, onSuccess?: () => void) => {
  const notify = useUiStore(s => s.notify)
  const { mutate, isPending } = useCreateProduct()

  const handleSubmit = (values: AddProductFormValues) => {
    mutate(values, {
      onSuccess: () => {
        notify('Product added successfully', 'success')
        onSuccess?.()
      },
      onError: (err: any) => {
        if (err.response?.status === 422 && err.response.data.errors) {
          Object.entries(err.response.data.errors).forEach(([field, messages]: [any, any]) => {
            setError(field, { message: messages[0] })
          })
        }
      },
    })
  }
  return { handleSubmit, isPending }
}
```

---

## 11. Feature Form Component
**File:** `src/modules/inventory/components/AddProductForm.tsx`

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormField, Button } from '@/components'
import { addProductSchema, type AddProductFormValues } from '../hooks/validation'
import { useAddProduct } from '../hooks/useAddProduct'

export const AddProductForm = ({ onClose }: { onClose: () => void }) => {
  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
  })
  const { handleSubmit, isPending } = useAddProduct(form.setError, onClose)

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <FormField label="Product Name" error={form.formState.errors.name?.message} required>
        <input {...form.register('name')} className="erp-input" />
      </FormField>
      <Button type="submit" loading={isPending}>Save</Button>
    </form>
  )
}
```

---

## 12. AG Grid DataTable Wrapper
**File:** `src/components/DataTable/DataTable.tsx`

```tsx
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

export const DataTable = <T,>({ rows, columns, loading }: { rows: T[], columns: ColDef<T>[], loading?: boolean }) => (
  <div style={{ height: '500px' }} className="ag-theme-quartz w-full">
    <AgGridReact rowData={rows} columnDefs={columns} loading={loading} />
  </div>
)
```

---

## 13. Page Component Pattern
**File:** `src/modules/inventory/views/ProductListPage.tsx`

```tsx
import { useState } from 'react'
import { useProducts } from '../api/inventory.api'
import { PageHeader, DataTable } from '@/components'
import { PermissionGuard } from '@/layouts/guards'

export const ProductListPage = () => {
  const { data, isLoading } = useProducts({ page: 1, per_page: 25 })

  return (
    <div className="erp-page">
      <PageHeader title="Products" />
      <DataTable rows={data?.data ?? []} columns={[]} loading={isLoading} />
    </div>
  )
}
```

---

## 14. Module index.ts (Public API)
**File:** `src/modules/inventory/index.ts`

```typescript
export { ProductListPage } from './views/ProductListPage'
export * from './api/types'
```

---

## 15. Laravel 422 Error Mapping Utility
**File:** `src/utils/setServerErrors.ts`

```typescript
import type { UseFormSetError, FieldValues, Path } from 'react-hook-form'

export const setServerErrors = <T extends FieldValues>(errors: Record<string, string[]>, setError: UseFormSetError<T>) => {
  Object.entries(errors).forEach(([field, messages]) => {
    setError(field as Path<T>, { type: 'server', message: messages[0] })
  })
}
```

---

## 16. BDT Currency + Date Formatters
**File:** `src/utils/formatters.ts`

```typescript
export const formatBDT = (amount: number) =>
  new Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT' }).format(amount)

export const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
```

---

## 17. AppShell Layout
**File:** `src/layouts/AppShell/AppShell.tsx`

```tsx
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const sidebarOpen = useUiStore(s => s.sidebarOpen)
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={sidebarOpen ? 'w-64' : 'w-0'}>Sidebar</aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

---

## 18. TanStack Query Provider
**File:** `src/main.tsx` (or a dedicated provider file)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* ... providers and router */}
  </QueryClientProvider>
)
```
