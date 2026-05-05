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

## Task Group 5: Forgot Password Implementation
- [x] **Task 5.1**: Add `forgotPassword` and `resetPassword` methods to `AuthController` in `authkit` applet.
- [x] **Task 5.2**: Register password reset routes in `authkit`'s `api.php`.
- [x] **Task 5.3**: Implement `ForgotPasswordPage` component and its API hooks in React.
- [x] **Task 5.4**: Implement `ResetPasswordPage` component and its API hooks in React.
