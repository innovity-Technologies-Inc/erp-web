# Phase 3: Inventory Module Tasks

## Task Group 1: Sales Terms & Conditions
- [x] **Task 1.1**: Create `terms.api.ts` and `useTerms.ts` hooks.
- [x] **Task 1.2**: Implement `TermsListPage.tsx` with `ListPageLayout`.
- [x] **Task 1.3**: Build `TermModal.tsx` for Add/Edit operations.
- [x] **Task 1.4**: Implement professional `ConfirmationModal` for deletion.
- [x] **Task 1.5**: Integrate `exportToExcel` utility for professional reports.
- [x] **Task 1.6**: Fix modal reset logic to ensure fresh data on every open.

## Task Group 2: Manage Sales
- [x] **Task 2.1**: Update `useSales.ts` to follow new notification standards.
- [x] **Task 2.2**: Implement `SalesListPage.tsx` using `ListPageLayout`.
- [x] **Task 2.3**: Configure custom columns for Sales (Invoice No, Sales By, Channel, etc.).
- [x] **Task 2.4**: Update backend `SaleApiController` to support status and date range filtering.
- [x] **Task 2.5**: Implement navigation to separate Create/Edit pages.
- [x] **Task 2.6**: Fix pagination footer to use `recordsFiltered` for accurate results count.

## Task Group 3: Shared UI Utilities
- [x] **Task 3.1**: Create `ConfirmationModal.tsx` for destructive actions.
- [x] **Task 3.2**: Create `exportUtils.ts` with `ExcelJS` integration.
- [x] **Task 3.3**: Enhance `DateRangePicker.tsx` with year/month dropdowns for quick navigation.
- [x] **Task 3.4**: Add `statusOptions` support to `ListPageLayout.tsx` for dynamic filter labels.

## Task Group 4: Manage Contact Us
- [x] **Task 4.1**: Create `contactUs.api.ts` and `useContactUs.ts` hooks.
- [x] **Task 4.2**: Implement `ContactUsListPage.tsx` with standard date and status columns.
- [x] **Task 4.3**: Build `ContactUsReplyPage.tsx` using a strict two-column grid layout.
- [x] **Task 4.4**: Implement specialized date formatter for high-detail message timestamps.
- [x] **Task 4.5**: Add "Discard" logic with confirmation to prevent data loss.
- [x] **Task 4.6**: Integrate sidebar entry and synchronization of navigation tabs.

## Task Group 5: Invoice Payment List
- [x] **Task 5.1**: Define `InvoicePaymentListItem` interface and API hooks in `sales.api.ts`.
- [x] **Task 5.2**: Create `useUsers.ts` hook to power dynamic filters.
- [x] **Task 5.3**: Implement `InvoicePaymentListPage.tsx` with advanced `toolbarExtra` filtering.
- [x] **Task 5.4**: Configure complex column definitions (Amount alignment, Status badges, HTML stripping).
- [x] **Task 5.5**: Fix backend `SaleApiController` to support Status, Approved By, and Date Range filtering.
- [x] **Task 5.6**: Update sidebar and tab navigation to include "Sales Payment".

## Task Group 6: UI/UX Refinement & Navigation
- [x] **Task 6.1**: Refactor `Sidebar.tsx` to remove redundant Inventory sub-items and implement `activePaths` logic for the "Sale" item.
- [x] **Task 6.2**: Fix SL (Serial Number) calculation across all inventory list views to support continuous pagination (currentPage/pageSize logic).
- [x] **Task 6.3**: Update `columnDefs` dependencies in list views to react to page changes for SL updates.
