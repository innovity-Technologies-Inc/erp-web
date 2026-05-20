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

## Task Group 7: Sales Transaction Implementation
- [x] **Task 7.1**: Build `SaleCreatePage.tsx` with a multi-step purchase header and interactive item table.
- [x] **Task 7.2**: Implement a **Synchronous Calculation Engine** to provide instant feedback on grand totals and row-level pricing.
- [x] **Task 7.3**: Enhance `RichEditor` with a custom toolbar and improved typography for professional sale terms.
- [x] **Task 7.4**: Integrate dynamic API hooks for warehouse-product dependency and merchant detail fetching.
- [x] **Task 7.5**: Implement payment type logic to automate credit sale transitions and paid amount resets.
- [x] **Task 7.6**: Finalize the store payload structure to match backend multi-item transaction requirements.
- [x] **Task 7.7**: Implement `SaleEditPage.tsx` using `useSaleDetails` to fetch initial data via the `getReturnData` endpoint, mapping response data to populate the dynamic form.
- [x] **Task 7.8**: Configure React Router parameterized route for editing sales.
- [x] **Task 7.9**: Implement `SaleViewPage.tsx` with a high-fidelity layout matching the reference design, including billing cards and a detailed product table.
- [x] **Task 7.10**: Set up the parameterized route for the Sale View and link it to the Sales List.

## Task Group 8: Vendor Management Implementation
- [x] **Task 8.1**: Create `suppliers.api.ts` and `useSuppliers.ts` hooks for backend communication.
- [x] **Task 8.2**: Implement `VendorListPage.tsx` with `ListPageLayout` and advanced multi-location filtering.
- [x] **Task 8.3**: Build `VendorCreatePage.tsx` with a professional 7/5 multi-card form layout, optimized contact row, and Zod validation.
- [x] **Task 8.4**: Build `VendorEditPage.tsx` featuring the same 7/5 split and automated data hydration using the `useSupplierData` hook.
- [x] **Task 8.5**: Configure dedicated routes for Vendor workflow (`/inventory/vendors/create`, `/inventory/vendors/edit/$id`).
- [x] **Task 8.6**: Refactor `ListPageLayout.tsx` to handle optional navigation tabs and standardized action buttons.
- [x] **Task 8.7**: Integrate "Vendor" as a standalone menu item in the Sidebar with proper path synchronization (active highlight for Create/Edit routes).
- [x] **Task 8.8**: Perform project-wide audit to standardize all primary, secondary, and icon buttons to match the established "Design Flow".
- [x] **Task 8.9**: Update Vendor validation and UI (Create, Edit, Modal) to make only Vendor Name mandatory, removing asterisk marks and red borders from optional fields.
- [x] **Task 8.10**: Implement **Column Visibility Toggle** and **Core Toolbar Filtering** (Search, Status, Date Range) in the Vendor List page, ensuring real-time server-side synchronization while maintaining a clean one-line layout.
- [x] **Task 8.11**: Perform project-wide standardization of all `<input>`, `<textarea>`, and `Select2` focus and hover styles, replacing hardcoded hex values with `primary` color tokens and adding `hover:border-gray-300`.
- [x] **Task 8.12**: Implement project-wide **Permission-Based UI**: Standardize permission strings to underscores, wrap action buttons in `PermissionGuard`, and dynamically hide table action columns. Added global bypass for **`super-admin`** role while enforcing strict validation for all other roles.

## Task Group 9: Merchant Management Implementation
- [x] **Task 9.1**: Create `merchants.api.ts` and `useMerchants.ts` hooks for backend communication.
- [x] **Task 9.2**: Implement `MerchantListPage.tsx` with `ListPageLayout`, AG Grid, and professional filtering.
- [x] **Task 9.3**: Build `MerchantCreatePage.tsx` with a high-fidelity 7/5 multi-card form layout, matching the **Business Information**, **Registered Address**, **Contact Details**, and **Commission & Settings** visual blocks exactly.
- [x] **Task 9.4**: Build `MerchantEditPage.tsx` featuring automated data hydration and high-fidelity card-based UI matching the Create design.
- [x] **Task 9.5**: Configure dedicated routes for Merchant workflow (`/inventory/merchant`, `/inventory/merchant/create`, `/inventory/merchant/edit/$id`).
- [x] **Task 9.6**: Implement specialized UI components: **Upload Button** with status feedback, **Active Merchant Switch**, and **Password Visibility Toggle**.
- [x] **Task 9.7**: Enforce strict **Zod validation** for all mandatory fields identified in the design breakdown images.
- [x] **Task 9.8**: Refactor Merchant forms into a **two-row grid layout** to ensure perfect horizontal bottom alignment (equal heights) for Business Info/Contact and Address/Commission cards.
- [x] Task 9.9: Fix **Merchant List filtering** (Status, Date Range) by implementing explicit filter handling in the backend `MerchantApiController@datatable`.
- [x] Task 9.10: Resolve **Document Preview** issues in Edit page by handling both HTML links and raw paths returned from the backend.

## Task Group 10: Late-Phase UI Fixes & Refinements
- [x] **Task 10.1**: Fix **DateRange selection persistence** in Merchant and Vendor list pages by correctly passing state props to `ListPageLayout`.
- [x] **Task 10.2**: Restructure **Sales Sub-routes** to move "Terms" and "Contact Us" under `/inventory/sales/*`, updating all route definitions and navigation tabs.
- [x] **Task 10.3**: Fix **Vendor List Pagination** to use `recordsFiltered` for accurate total page calculation during server-side filtering.
- [x] **Task 10.4**: Update project **SKILL.md** to mandate dynamic breadcrumb generation and DateRange state synchronization to prevent regressions.

## Task Group 11: Warehouse Management Implementation
- [x] **Task 11.1**: Update `WarehouseApiController.php` payload to use null-coalescing and add `DB::beginTransaction()` for safety.
- [x] **Task 11.2**: Implement `getData` in `WarehouseApiController` and register the route in `api.php`.
- [x] **Task 11.3**: Update `WarehouseListPage.tsx` to use numeric ID for edit navigation and standard AG Grid action renderers.
- [x] **Task 11.4**: Refactor `WarehouseEditPage.tsx` to handle numeric ID parameters, fetch data via `get-data`, and use `uuid` internally for updates.
- [x] **Task 11.5**: Standardize `WarehouseEditPage` header with `[Warehouse Name]` decoration and professional loading state.
- [x] **Task 11.6**: Implement ID-masking logic in `Topbar.tsx` to hide numeric/UUID segments from breadcrumbs.

## Task Group 12: Architectural Reorganization
- [x] **Task 12.1**: Restructure `src/modules/inventory/views` into entity-specific subfolders (`merchant`, `sales`, `vendors`, `warehouse`).
- [x] **Task 12.2**: Update all view exports in `src/modules/inventory/index.ts` to reflect new folder paths.
- [x] **Task 12.3**: Update project **SKILL.md** to establish the folder-based view convention as a mandatory standard for future modules.

## Task Group 13: Stock Movement Implementation
- [x] **Task 13.1**: Update `stockMovementSchema` in `validation.ts` to use `z.coerce.number()` for all ID and quantity fields to handle string inputs from dropdowns.
- [x] **Task 13.2**: Implement `StockMovementCreatePage.tsx` with a two-column layout: **Movement Details** and **Batch Details**.
- [x] **Task 13.3**: Build specialized sub-components (`BatchCard`, `ItemRow`) to handle complex nested form state with React Hook Form's `useFieldArray`.
- [x] **Task 13.4**: Implement dynamic cross-filtering logic for batches and products using `useMemo` and `useWatch`.
- [x] **Task 13.5**: Integrate real-time `avl_qty` fetching and validation with immediate user feedback via `NotificationModal`.
- [x] **Task 13.6**: Implement state synchronization: Resetting dependent fields (To Warehouse, Batches) when primary selections change.
- [x] **Task 13.7**: Update `onSubmit` handler to flatten nested batch/item data into the API payload format and enforce a final duplicate entry check.
- [x] **Task 13.8**: Configure successful submission to trigger a full form reset (`reset()`) instead of navigation, returning the UI to its initial state.

## Task Group 14: Product Management Refinement
- [x] **Task 14.1**: Implement `useToggleUnitStatus` and `useToggleCategoryStatus` hooks for real-time list updates.
- [x] **Task 14.2**: Update `ProductCategoryApiController.php` to include `created_at` and support server-side filtering by `status` and `date_range`.
- [x] **Task 14.3**: Refactor `CategoryListPage.tsx` to support both Category and Sub-Category views with dynamic column headers and clean name rendering.
- [x] **Task 14.4**: Implement hierarchical traversal for the Category selection dropdown with `-- ` prefixes.
- [x] **Task 14.5**: Add "DATE" column to `UnitListPage` and `CategoryListPage` with full filter synchronization.
- [x] **Task 14.6**: Update `CategoryModal.tsx` to conditionally hide the Parent Category field based on the module context (Category vs Sub-Category).
- [x] **Task 14.7**: Perform final backend validation audit to ensure `sometimes|required` logic for partial updates (Status Toggling) is correctly implemented.
- [x] **Task 14.8**: Implement `useToggleProductStatus` hook and update `ProductListPage.tsx` with a functional status toggle column and backend filtering synchronization.



