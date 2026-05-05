# Authentication & Authorization System Documentation

This document describes the implementation of the authentication and authorization system in the `erp_frontend`.

## 1. Core Architecture
The system uses **JWT (JSON Web Tokens)** for authentication and **RBAC (Role-Based Access Control)** for authorization. State is managed using **Zustand** with persistence to `localStorage`.

### Key Components:
- **`useAuthStore`**: Stores user data, JWT token, and the permissions array.
- **`usePermissions`**: A custom hook that provides logic for checking permissions and handling `super-admin` bypass.
- **`AuthGuard`**: Protects routes from unauthenticated access.
- **`PermissionGuard`**: Protects specific UI components or features based on permissions.

---

## 2. Authentication Flow

### Login
1. User submits credentials via `LoginPage`.
2. `useLogin` hook calls the backend API.
3. On success, the backend returns:
   - `token`: JWT string.
   - `user`: Object containing user details and roles.
   - `permissions`: A flat array of strings.
   - `expires_in`: Number of seconds until the token expires.
4. `useAuthStore.setUser()` calculates `expiresAt` (current time + `expires_in`) and saves everything to `localStorage`.

### Token Security & Expiration
The system implements a **multi-layer token protection** strategy:

1.  **Reactive Check (Interceptors)**: The `apiClient` (Axios) has a response interceptor that catches `401 Unauthorized` errors. If the backend rejects a token, the frontend immediately clears the session and redirects to login.
2.  **Proactive Check (Request Interceptor)**: Before any request is sent, the system checks the current time against `expiresAt`. If the token is already expired, the request is blocked, and the user is logged out locally.
3.  **Route Protection (AuthGuard)**: Every time a user navigates, the `AuthGuard` checks if the token exists AND if it is still valid. If expired, it prevents access to the page.

### Logout
- Calling `useAuthStore.clearUser()` wipes the token, user, permissions, and `expiresAt` from the store and `localStorage`.
- The `AuthGuard` detects the missing/expired token and redirects the user to `/login`.

---

## 3. Authorization (Permissions & Roles)

### Roles
Roles are stored within the `user.roles` array. The system specifically looks for the `super-admin` role to bypass all permission checks.

### Permissions
Permissions are provided by the backend as a flat array of strings. These usually follow the format `action_module` (e.g., `view_product`).

### Super-Admin Logic
A user with the `super-admin` role has access to everything. This is implemented in the `usePermissions` hook:
```typescript
const isSuperAdmin = user?.roles?.some(role => role.name === 'super-admin')
const hasPermission = (permission: string) => isSuperAdmin || permissions.includes(permission)
```

---

## 4. Usage in UI

### Protecting Routes
Routes are grouped under the `_authenticated` layout in TanStack Router, which is wrapped in an `AuthGuard`.
```tsx
// src/routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  component: () => (
    <AuthGuard>
      <AppShell />
    </AuthGuard>
  ),
})
```

### Protecting Features (PermissionGuard)
Use the `PermissionGuard` to wrap buttons, tabs, or sections.
```tsx
<PermissionGuard permission="create_product">
  <button>Add New Product</button>
</PermissionGuard>
```

### Dynamic Menu (Sidebar)
The sidebar menu is automatically filtered. If a `menuItem` has a `permission` property, it is only shown if the user has that permission (or is a `super-admin`).
```typescript
const filteredMenuItems = menuItems.filter(item => !item.permission || hasPermission(item.permission))
```

### Programmatic Checks
Use the `usePermissions` hook for logic inside components:
```typescript
const { hasPermission } = usePermissions();
if (hasPermission('delete_user')) {
  // perform sensitive action
}
```
