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
- [x] **Task 2.7**: Implement a robust backend `delete` method in `SaleApiController` with approval checks, automated stock restoration, and transaction integrity.

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
- [x] **Task 7.11**: Implement high-fidelity **Print Support** for `SaleViewPage`, including global UI exclusion (sidebar/header/devtools) and single-page layout optimization.

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

## Task Group 15: Product High-Fidelity Redesign
- [x] **Task 15.1**: Update `productSchema` in `validation.ts` to include `status`, `no_of_qty`, and frontend-only `main_category_id`.
- [x] **Task 15.2**: Refactor `ProductCreatePage.tsx` with high-fidelity two-column grid (7/5 split) and standard card components (Basic Info, Pricing, Details, Media, Vendor).
- [x] **Task 15.3**: Implement dependent category dropdowns: `useMainCategorySelect2` and `useSubCategorySelect2(parentId)`.
- [x] **Task 15.4**: Build sophisticated **Product Media** upload component with dotted borders, file feedback, and preview handling.
- [x] **Task 15.5**: Add branded **Active Product Toggle** in Vendor & Status section.
- [x] **Task 15.6**: Build `ProductEditPage.tsx` matching Create design, featuring automated parent category resolution to hydrate the Main Category dropdown correctly.
- [x] **Task 15.7**: Resolve runtime `ReferenceError` for missing hook imports in Create/Edit pages.
- [x] **Task 15.8**: Finalize form submission to correctly map sub-category to `category_id` and handle multipart/form-data for image uploads.
- [x] **Task 15.9**: Implement real-time **Per Pcs Price** calculation logic (`Sell Price / Pcs`) with read-only UI and pack-size label standardization.
- [x] **Task 15.10**: Fix stale cache issue in **Product Edit** page by invalidating `product-details` query key in update hooks.
- [x] **Task 15.11**: Implement recursive sub-category path generation in **Select2 API** to show full hierarchical depth (e.g., `Sub > Child`) in Product Create/Edit dropdowns.

## Task Group 16: Purchase Management Implementation
- [x] **Task 16.1**: Create `purchase.api.ts` with comprehensive endpoints for datatable, store, update, delete, and retrieval.
- [x] **Task 16.2**: Implement `usePurchases.ts` TanStack Query hooks including specialized hooks for Chalan/Batch availability checks.
- [x] **Task 16.3**: Update `validation.ts` with a robust `purchaseSchema` supporting nested item-warehouse structures.
- [x] **Task 16.4**: Build `PurchaseCreatePage.tsx` with high-fidelity two-column layout and sticky payment summary.
- [x] **Task 16.5**: Implement `PurchaseItemRow` component with nested `useFieldArray` for granular warehouse allocations.
- [x] **Task 16.6**: Develop synchronous calculation engine for real-time item totals and global billing aggregation.
- [x] **Task 16.7**: Implement frontend-to-backend data flattening logic to ensure nested state matches legacy API expectations.
- [x] **Task 16.8**: Build `PurchaseListPage.tsx` featuring professional status badges, advanced filtering, and Excel export.
- [x] **Task 16.9**: Build `PurchaseEditPage.tsx` with complex data re-nesting/hydration logic to correctly populate the multi-warehouse UI from flattened API data.
- [x] **Task 16.10**: Create `PurchaseViewPage.tsx` (Invoice) with high-fidelity branding, organizational context, and print support (including sidebar/header exclusion and single-page optimization).
- [x] **Task 16.11**: Implement backend `delete` method in `PurchaseApiController` to safely handle removal of purchase records and associated accounting/batch data.
- [x] **Task 16.11**: Define type-safe routes for all purchase views and register them in the modular inventory index.
- [x] **Task 16.12**: Reorganize `ListPageLayout` and `PurchaseListPage` toolbar to group Search, Vendor, and Status filters side-by-side with high-fidelity styling.
- [x] **Task 16.13**: Resolve `RangeError: Invalid time value` by implementing a robust global `formatDate` utility with malformed date protection.
- [x] **Task 16.14**: Refactor `PurchaseApiController@datatable` to support server-side filtering by Vendor, Status, and Date Range while ensuring plain-text clean data output.
- [x] **Task 16.15**: Apply high-fidelity design updates to **Purchase Create/Edit** pages, matching visual samples for header styling, nested item cards, sticky summaries, and custom upload components.
- [x] **Task 16.16**: Implement global **Duplicate Item Prevention** logic across multiple rows with high-impact error notifications.
- [x] **Task 16.17**: Develop reactive **Warehouse Stock Tracking** within nested item rows using specialized API hooks.
- [x] **Task 16.18**: Implement **Transaction-Aware Stock Calculation** for Edit mode to accurately reflect available quantities.
- [x] **Task 16.19**: Refine **Chalan & Batch Validation** to support intelligent self-conflict checks during record updates.

## Task Group 17: System-Wide Standardization
- [x] **Task 17.1**: Create global `LoadingState` component in `src/components/Loading/LoadingState.tsx` featuring branded animations and typography.
- [x] **Task 17.2**: Surgically integrate `LoadingState` across all management modules (Purchase, Sale, Merchant, Vendor, Product, Warehouse) to replace inconsistent localized spinners.
- [x] **Task 17.3**: Standardize **Payment Summary** and **Add Item** visuals (colors, icons, spacing) across all transaction modules for a unified user experience.
- [x] **Task 17.4**: Perform project-wide cleanup of unused `Loader2` imports and manual loading blocks to ensure code quality.

## Task Group 18: Service Management Implementation
- [x] **Task 18.1**: Create `service.api.ts` and `useService.ts` hooks for backend communication.
- [x] **Task 18.2**: Implement `ServiceListPage.tsx` using `ListPageLayout` with AG Grid and standard action renderers.
- [x] **Task 18.3**: Build `ServiceFormModal.tsx` featuring a high-fidelity design, 2-column layout for Charge/VAT, and a visual status toggle.
- [x] **Task 18.4**: Implement server-side filtering (Search, Status, Date Range) in `ServiceApiController@datatable`.
- [x] **Task 18.5**: Implement **Column Visibility Toggle** in `ServiceListPage` and ensure AG Grid reactivity via `useMemo` dependencies.
- [x] **Task 18.6**: Fix `SyntaxError` issues by standardizing API exports and imports across modular files.

## Task Group 19: Service Invoice Management Implementation
- [x] **Task 19.1**: Update `ServiceApiController` to include `showServiceInvoice` and support numeric ID lookups.
- [x] **Task 19.2**: Build `ServiceInvoiceListPage.tsx` with navigation tabs and advanced server-side filtering.
- [x] **Task 19.3**: Develop `ServiceInvoiceForm.tsx` with a high-fidelity 7/5 grid layout and sticky payment summary.
- [x] **Task 19.4**: Implement dynamic row management with `useFieldArray` and real-time calculation synchronization.
- [x] **Task 19.5**: Build `ServiceInvoiceCreatePage.tsx` and `ServiceInvoiceEditPage.tsx` with automated data mapping and persistent `Select2` selection logic.
- [x] **Task 19.6**: Implement `ServiceInvoiceViewPage.tsx` featuring a premium layout matching the Sale View design with organizational context and print support.
- [x] **Task 19.7**: Refine form submission logic to use standard `onSubmit` with calculated totals (`payment_amount`, etc.) to resolve backend array key errors.
- [x] **Task 19.8**: Standardize all transaction buttons with branded icons (`Save`, `PenLine`) and disabled automatic error focus.

## Task Group 20: Project-Wide Routing Standardization
- [x] **Task 20.1**: Perform a project-wide sweep to rename all `$uuid.tsx` route files back to `$id.tsx`.
- [x] **Task 20.2**: Update all `createFileRoute` definitions to use the standardized `$id` parameter.
- [x] **Task 20.3**: Refactor all `useParams` calls to destructure `id` only, removing all `uuid` parameter references from component code.
- [x] **Task 20.4**: Audit and update all `navigate` calls to consistently use the `id` key in the `params` object, passing UUID strings where required by the backend.
- [x] **Task 20.5**: Remove legacy `parseInt` logic from view components that were incorrectly treating UUID strings as numeric IDs.
- [x] **Task 20.6**: Update **Select2** component to support `filterOption={() => true}` by default when server-side searching is active, preventing incorrect local filtering of valid results.

## Task Group 21: Quotation UI Refactor
- [x] **Task 21.1**: Refactor `QuotationForm.tsx` to implement the modular summary card pattern for Items.
- [x] **Task 21.2**: Implement the matching summary card pattern for Service Quotation.
- [x] **Task 21.3**: Update the "Add Service Quotation" button with specific blue branding and left-aligned layout matching high-fidelity samples.
- [x] **Task 21.4**: Standardize the final action buttons container width to `400px` to match summary cards.
- [x] **Task 21.5**: Fix **Warehouse Select2** data mapping in `QuotationForm.tsx` to safely handle varied API response structures.
- [x] **Task 21.6**: Resolve JSX **PARSE_ERROR** by wrapping sibling elements in a fragment within the Service Quotation section.
- [x] **Task 21.7**: Standardize **Service Select2** and **Product Select2** data mapping to handle `.data`, `.results`, or raw array responses with robust label fallbacks (`text`, `service_name`, `product_name`).
- [x] **Task 21.8**: Refactor row components (`SaleItemRow`, `ServiceItemRow`) to use options passed from the parent, eliminating redundant internal fetches and resolving data loading bugs.
- [x] **Task 21.9**: Implement backend and frontend integration for `start_date`, `end_date`, and `status` filters on the `QuotationListPage`.
- [x] **Task 21.10**: Adjust padding (`px-2 py-0`) on the "Added to Invoice" status badges to prevent overflow in tightly constrained AG Grid table cells.
- [x] **Task 21.11**: Fix React "Cannot update a component while rendering a different component" warning by wrapping the Zustand state mutation (`clearUser`) inside a `useEffect` hook in `AuthGuard.tsx`.
- [x] **Task 21.12**: Fix login page scrolling by adding `overflow-y-auto max-h-screen` to the form container in `AuthLayout.tsx`.

## Task Group 22: Return & Exchange Implementation
- [x] **Task 22.1**: Update backend `Select2ApiController@getPurchaseSelect2` to support `supplier_id` filtering.
- [x] **Task 22.2**: Implement `storeSupplierReturn` and `getPurchaseSelect2` in `return.api.ts` and `purchase.api.ts`.
- [x] **Task 22.3**: Build `VendorReturnCreatePage.tsx` with a high-fidelity full-width layout and reactive 8:4 summary split matching visual mockups.
- [x] **Task 22.4**: Update backend `ReturnApiController` to fix pagination counting using `distinct()` and add a dedicated JSON `supplierReturnDetails` endpoint.
- [x] **Task 22.5**: Fix `VendorReturnListPage.tsx` filtering logic by mapping `fromDate/toDate` to matching backend parameter keys.
- [x] **Task 22.6**: Build `VendorReturnDetailsPage.tsx` featuring high-fidelity printable invoice structure, billing cards, and standardized summary tables matching the Sale/Purchase View design.
- [x] **Task 22.7**: Link "View Details" action in the Return List to the newly created details route using parameterized navigation.

## Task Group 23: Build System & Type Safety Fixes
- [x] **Task 23.1**: Resolve project-wide **casing errors** for `ListPageLayout.tsx` and update all 18 import statements to match the file's PascalCase naming.
- [x] **Task 23.2**: Fix **Duplicate Identifier** errors in `ListPageLayout` by removing redundant `toolbarExtra` property declarations.
- [x] **Task 23.3**: Update `validation.ts` to fix **Zod coercion** issues: Replace `required_error` with explicit `.min(1, '...')` for numeric ID fields.
- [x] **Task 23.4**: Fix **API Response Mapping**: Update `VendorReturnCreatePage.tsx` and `purchase.api.ts` to correctly handle raw object responses vs. wrapped `ApiResponse` structures.
- [x] **Task 23.5**: Install and integrate `@types/file-saver` to provide type safety for the global export utilities.
- [x] **Task 23.6**: Remove unused imports (Search, Save, Info, clsx) and unused declarations (`getInvoiceReturnDetails`) to satisfy strict build requirements.
- [x] **Task 23.7**: Implement null-safety for logo images in `VendorReturnDetailsPage.tsx` to prevent runtime crashes.
- [x] **Task 23.8**: Resolve **TanStack Router path validation** errors by applying surgical `as any` casting to dynamically generated return-module routes.

## Task Group 24: Return Data Persistence Improvements
- [x] **Task 24.1**: Create Laravel migration to add `primary_category` and `detailed_description` columns to the `product_return` table.
- [x] **Task 24.2**: Update backend `ReturnApiController` to capture and store these two new fields for both Supplier and Invoice returns.
- [x] **Task 24.3**: Update `VendorReturnCreatePage.tsx` to include `primaryCategory` and `detailedDescription` in the store payload.
- [x] **Task 24.4**: Enhance `VendorReturnDetailsPage.tsx` to display the saved category and rich-text description in a dedicated "Return Information" section.

## Task Group 25: Merchant Return (Return & Exchange) Implementation
- [x] **Task 25.1**: Add `storeInvoiceReturn`, `getInvoiceSelect2`, and `getInvoiceReturnDetails` to `return.api.ts`.
- [x] **Task 25.2**: Create `useStoreInvoiceReturn`, `useInvoiceSelect2`, and `useInvoiceReturnDetails` hooks in `useReturn.ts`.
- [x] **Task 25.3**: Build high-fidelity `MerchantReturnCreatePage.tsx` with a dual-table workflow (Return + Exchange) and real-time net balance calculations.
- [x] **Task 25.4**: Implement **Return Header** and **Return Summary Card** in Create page matching high-fidelity design references.
- [x] **Task 25.5**: Standardize **Reorder / New Order** table and **Payment Summary** (Blue Card) to ensure visual consistency with Sale module.
- [x] **Task 25.6**: Implement `MerchantReturnDetailsPage.tsx` with high-fidelity design, billing context, and print support.
- [x] **Task 25.7**: Create specialized `WastageDetailsPage.tsx` for viewing discarded items.

## Task Group 26: Return Module Standardization & UX Refinement
- [x] **Task 26.1**: Overhaul **Wastage Details** design to exactly match the Blue Primary theme and layout of standard return details.
- [x] **Task 26.2**: Standardize **Header ID Display**: Update all return views to show Original Invoice/Purchase ID as main title and unique Return ID as subtitle.
- [x] **Task 26.3**: Clean up **List Pages**: Remove HTML anchor tags from Invoice No columns in Vendor, Merchant, and Wastage lists to show plain-text IDs.
- [x] **Task 26.4**: Configure module exports and TanStack Router routes for the Merchant Return submodule.
- [x] **Task 26.5**: Perform project-wide TypeScript cleanup and ensure a zero-warning build for the entire Return module.

## Task Group 27: Sales Reports Implementation
- [x] **Task 27.1**: Consolidate and resolve build errors (`npm run build`) caused by missing interfaces and unused imports in `SalesReportPage`.
- [x] **Task 27.2**: Implement `MerchantWiseSalesReportPage` with AG Grid, `Select2` filtering, and the Appended In-Grid Summary Row pattern for perfect column alignment.
- [x] **Task 27.3**: Implement `UserWiseSalesReportPage` and sync the default date ranges to the current month to match backend API defaults.
- [x] **Task 27.4**: Implement `ProductWiseSalesReportPage` and `CategoryWiseSalesReportPage` featuring robust numeric parsing (stripping commas/symbols) to prevent AG Grid "Invalid Number" errors.
- [x] **Task 27.5**: Implement `InvoiceWiseDueReportPage` with specific fallback sorting fixes in the backend `ReportApiController` to prevent SQL crashes (`Unknown column i.id`).
- [x] **Task 27.6**: Integrate secure **PDF and Excel Exports** for all reports using `apiClient.get` and `responseType: 'blob'`, resolving authorization errors.
- [x] **Task 27.7**: Implement high-fidelity **Mail Preview Modal** with dark background, loaded dynamically via secure API blob endpoints.
- [x] **Task 27.8**: Add a **Cancel Confirmation** to the Mail Preview modal to prevent accidental closure.
- [x] **Task 27.9**: Standardize navigation: Incorporate all reports into the header `TabDropdown` and synchronize Sidebar active states.




