# Phase 1: Foundation & Project Setup Tasks

## Task Group 1: Project Scaffolding
- [x] **Task 1.1**: Run Vite initialization and clean up boilerplate.
- [x] **Task 1.2**: Install and configure Tailwind CSS.
- [x] **Task 1.3**: Set up `vite.config.ts` and `tsconfig.json` with `@/` path aliases.
- [x] **Task 1.4**: Create the modular directory structure (api, components, modules, etc.).

## Task Group 2: Core Library Integration
- [x] **Task 2.1**: Install all major dependencies (`zustand`, `react-query`, `tanstack-router`, `axios`, `ag-grid`).
- [x] **Task 2.2**: Set up TanStack Query provider and client.
- [x] **Task 2.3**: Set up TanStack Router root configuration.

## Task Group 3: Shared Infrastructure Implementation
- [x] **Task 3.1**: Create `src/api/client.ts` with Axios interceptors.
- [x] **Task 3.2**: Implement `src/store/useUiStore.ts` for notifications/toasts.
- [x] **Task 3.5**: Create a `Toast` component and container to render notifications globally.
- [x] **Task 3.6**: Enhance `useLogin` and `LoginPage` to properly handle and display API errors.
- [x] **Task 3.3**: Implement `src/store/useAuthStore.ts` with persist middleware.
- [x] **Task 3.4**: Create `AuthLayout` layout and modular `Auth` view components.
- [x] **Task 3.7**: Implement dynamic user data handling (first_name, last_name, roles array) in Topbar.
- [x] **Task 3.8**: Implement dynamic welcome message with user's full name in Dashboard.
- [x] **Task 3.9**: Implement real-time clock and date display in Dashboard.

## Task Group 4: Verification
- [x] **Task 4.1**: Verify environment variables loading.
- [x] **Task 4.2**: Test basic route protection with high-fidelity login implementation.

## Task Group 6: Dynamic Branding & Global Settings
- [x] **Task 6.1**: Create `GlobalSettingsController` in backend to expose `web_settings` and `company_information`.
- [x] **Task 6.2**: Add `GET /api/global-settings` public route to `api.php`.
- [x] **Task 6.3**: Implement `src/api/settings.api.ts` and `src/store/useSettingsStore.ts` in frontend.
- [x] **Task 6.4**: Create `useSettings` hook to fetch and provide site-wide branding data.
- [x] **Task 6.5**: Implement the professional split-screen design for the entire Authentication module.
- [x] **Task 6.6**: Implement dynamic theme injection (Primary, Info, Success, Warning, Danger colors) into document root.
- [x] **Task 6.7**: Configure Tailwind v4 `@theme` variables in `globals.css` to consume backend-driven CSS variables.
- [x] **Task 6.8**: Clean up redundant stylesheets and centralize ERP design tokens.
- [x] **Task 6.9**: Optimize `useSettings` and `useLogin` to ensure global settings are only fetched during login and initial load.
## Task Group 7: Global Typography & Design Tokens
- [x] **Task 7.1**: Import Poppins font and configure as global default in Tailwind theme.
- [x] **Task 7.2**: Implement Figma-precise font sizes and weights for authentication pages.

## Task Group 8: Table & Layout Optimization
- [x] **Task 8.1**: Resolve AG Grid auto-height issues by unsetting default min-heights in global CSS.
- [x] **Task 8.2**: Unify table borders by removing internal AG Grid borders and using ListPageLayout wrapper.
- [x] **Task 8.3**: Ensure perfect rounding alignment (16px) across all table containers.
- [x] Task 8.4: Preserve developer-defined font sizes and paddings for laptop screen compatibility.

## Task Group 9: Permission-Based UI & Security
- [x] **Task 9.1**: Implement `usePermissions` hook with support for permissions and 'Super-Admin' role override.
- [x] **Task 9.2**: Create `PermissionGuard` component for wrapping UI elements.
- [x] **Task 9.3**: Update `ListPageLayout` to support `createPermission` prop for the standard "+ Create" button.
- [x] **Task 9.4**: Retrofit existing modules (Inventory, etc.) to use `PermissionGuard` for Edit, Delete, and View actions.

## Task Group 10: Global Print Infrastructure
- [x] **Task 10.1**: Implement global `print:hidden` utility across foundational layout components (`Topbar`, `Sidebar`, `AppShell`).
- [x] **Task 10.2**: Configure global CSS overrides in `globals.css` to handle `overflow: hidden` and `height: 100vh` during printing to support multi-page documents.
- [x] **Task 10.3**: Wrap developer-only tools (e.g., `TanStackRouterDevtools`) in print-protected containers to ensure clean physical outputs.

