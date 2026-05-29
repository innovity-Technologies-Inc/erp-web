# Phase 3: Inventory Module Requirements

This document outlines the requirements for the Inventory module in the `erp_frontend` application.

## 1. Sales Terms & Conditions (Sub-module of Sales)
- [x] Implement terms list view with AG Grid.
- [x] Implement server-side pagination and search for terms.
- [x] Implement "Add Term" modal with Zod validation.
- [x] Implement "Edit Term" modal with proper state reset.
- [x] Implement professional "Delete Confirmation" modal.
- [x] Implement status filter (Active/Inactive).
- [x] Implement Date Range filter with year/month selection.
- [x] Implement professional Excel export (`.xlsx`) with auto-calculated widths.
- [x] **Route Update**: Moved to `/inventory/sales/terms`.

## 2. Manage Sales (Consolidated Module)
- [x] Implement sales list view with ListPageLayout.
- [x] Integrate server-side filtering (Search, Status, Date Range).
- [x] Implement navigation-based Create and Edit triggers.
- [x] Implement professional "Delete Confirmation" modal for invoices.
- [x] Implement professional Excel export for sales data.
- [x] Customize table columns: SL, Invoice No, Sales By, Channel, Merchant Name, Date, Delivery Note, Total Amount, Voucher Status, Action.
- [x] Map "Approved" and "Not Approved" status labels to backend voucher approval logic.
- [x] **Sub-route Restructuring**: Consolidated all sales-related management under `/inventory/sales/*` (including Terms, Payments, and Contact Us) for a unified module experience.

## 3. Manage Contact Us (Sub-module of Sales)
- [x] Implement contact messages list view with AG Grid and `ListPageLayout`.
- [x] Integrate server-side search and date range filtering.
- [x] Implement a dedicated **Two-Column Reply Page**:
    - **Left Column**: Client Info (ID, Name, Email, Phone) and Original Message (with Quote decoration).
    - **Right Column**: Compose Reply interface with a large professional textarea.
- [x] Implement "Reply Once" logic: hide the compose form and show previous reply if the message is already responded.
- [x] Implement "Discard" with a professional confirmation modal.
- [x] Ensure specific date formatting: "Month Day, Year · Time" (e.g., October 24, 2023 · 10:45 AM).
- [x] Standardize Client ID padding to 6 digits (e.g., #000001).
- [x] **Route Update**: Moved to `/inventory/sales/contact-us`.

## 4. Invoice Payment List (Sub-module of Sales)
- [x] Implement invoice payments list view using `ListPageLayout`.
- [x] Implement advanced server-side filtering:
    - **Search**: Global text search.
    - **Approved By**: Dynamic dropdown populated from system users.
    - **Status**: Dropdown for Approved, Pending, Unapproved.
    - **Date Range**: Filter by invoice date.
- [x] Standardize column renderers for amounts (bold, currency-formatted) and statuses (color-coded badges).
- [x] Implement professional Excel export stripping HTML from transaction references and statuses.
- [x] **Route Update**: Standardized under `/inventory/sales/payments`.

## 5. UI/UX Standards
- [x] Standardize on primary branded borders (`border-[#1e4ba1]/20`).
- [x] Use `ConfirmationModal` for all destructive actions.
- [x] Use `NotificationModal` (Big Success Modal) for all success messages.
- [x] Use Toast notifications strictly for background info and error reporting.
- [x] Ensure pagination footer accurately reflects `recordsFiltered`.
- [x] Implement **Continuous Serial Numbers (SL)**: Serial numbers must follow across pages (e.g., 1-10 on page 1, 11-20 on page 2).
- [x] Implement **Navigation Synchronization**: The Sidebar "Sale" item must remain active when navigating through sub-modules like Terms, Contact Us, and Sales Payments.
- [x] **DateRange Synchronization**: When using `ListPageLayout`, the `fromDate` and `toDate` props MUST be passed to the layout to ensure the picker reflects current filter state.
- [x] **Standardized Loading Indicators**: All data-fetching states must use the global `LoadingState` component to ensure system-wide visual consistency.

## 6. Sales Transaction (Create/Edit)
- [x] Implement dynamic warehouse-based product loading (must select warehouse before product).
- [x] Implement **Synchronous Calculation Engine**: Eliminate lag by calculating row totals and grand totals in real-time from raw inputs.
- [x] Implement a professional **Rich Text Editor** for Sale Details with support for Bold, Italic, Underline, Lists, Links, and Images.
- [x] Implement merchant-specific logic: Auto-fetch phone numbers and previous due balances upon selection.
- [x] Implement payment logic: Automatically reset paid amount to 0 for "Credit Sale" payment types.
- [x] Standardize on a professional multi-column header and interactive item table layout.
- [x] Implement robust Zod validation for complex nested item structures.
- [x] Implement **Sale Edit functionality** (`SaleEditPage`) replicating the Create design while seamlessly fetching, hydrating, and updating existing invoice data safely without touching legacy backend code.
- [x] **Robust Backend Integration**:
    - Updated `SaleApiController` to include a robust `delete` method with approval checks, automated stock restoration (returning quantities to BatchProduct), and transaction safety.
- [x] Implement a professional **Sale View Page** (`SaleViewPage`) matching the reference design, featuring pro-style billing cards, interactive status badges, a comprehensive payment summary, and high-fidelity print capabilities (including sidebar/header exclusion and single-page optimization).

## 7. Vendor Management (Standalone Workflow)
- [x] Implement a dedicated **Vendor List Page** using `ListPageLayout` with AG Grid and professional filtering.
- [x] Implement **Core Filtering**: Enable server-side filtering by **Search**, **Status**, and **Date Range** directly in the toolbar.
- [x] Implement **Column Visibility Toggle**: Allow users to show/hide specific columns (SL, Vendor ID, Name, Address, Date, Mobile, Email, Country, State, City, Zip, Status) for a customized view.
- [x] Implement separate **Vendor Create & Edit Pages**: Move away from modals to a decoupled workflow consistent with the Sales module.
- [x] Standardize on a professional multi-card form layout: **Vendor Information**, **Business Address** (spanning 7/12 width), and **Contact Details** (spanning 5/12 width).
- [x] Refine **Contact Details**: Group Contact Person and Phone into a single row, and remove Additional Details field for a cleaner interface.
- [x] Implement robust Zod validation (`supplierSchema`) where only **Vendor Name** is mandatory, making all other fields (mobile, address, etc.) optional to align with backend requirements.
- [x] Integrate with the legacy backend `/inventory/supplier` API for all CRUD operations using `uuid` and `id` mapping.
- [x] **Pagination Fix**: Ensure `recordsFiltered` is used for total page calculation to accurately reflect search/filter results.

## 11. Architectural Organization
- [x] **Folder-Based Views**: All inventory views are organized into entity-specific subfolders (`sales/`, `merchant/`, `vendors/`, `warehouse/`) within the `views/` directory to ensure long-term scalability and clear domain boundaries.
- [x] **Unified Public API**: All organized views are correctly exported through the module's `index.ts` to maintain a clean import interface for the router.

## 8. Final Design Standards (Project-Wide)
- [x] **Strict Button System**: Standardize all Save/Update (Green), Cancel (White), View (Blue), Edit (Emerald), and Delete (Rose) buttons.
- [x] **Standardized Input System**: All `<input>` and `<textarea>` elements MUST use the standardized focus style (`focus:ring-1 focus:ring-primary/30 focus:border-primary`) and hover style (`hover:border-gray-300`) with smooth transitions.
- [x] **Permission-Based UI**: All actions (Create, Edit, Delete, View) and action columns are strictly controlled by backend permissions.
- [x] **Super-Admin Bypass**: Implemented a global bypass for the `super-admin` role; users with this role have full access regardless of specific permissions, while all other roles are strictly validated.
- [x] **Typography Consistency**: Ensure **Poppins** is the only font family used, with `font-medium` for body and `font-black` for headers.
- [x] **Standardized Headers**: Use **Style A (With Tabs)** for module list pages and **Style B (No Tabs)** for individual transaction pages (Create, Edit, View).
- [x] **High-Impact Feedback**: Mandate the use of `NotificationModal` for all successful system updates.

## 9. Merchant Management (Full SPA Workflow)
- [x] Implement a dedicated **Merchant List Page** using `ListPageLayout` with AG Grid and professional filtering (Search, Status, Date Range).
- [x] Implement **Column Visibility Toggle**: Allow users to show/hide specific columns (SL, Merchant Name, Mobile, Email, SP No, SP File, Balance, Status).
- [x] Implement separate **Merchant Create & Edit Pages**: Standalone professional multi-card form layout matching the high-fidelity design standard, organized into two standardized rows for perfect visual balance:
    - **Row 1 (Equal Height)**: **Business Information** (7/12) and **Contact Details** (5/12).
    - **Row 2 (Equal Height)**: **Registered Address** (7/12) and **Commission & Settings** (5/12).
- [x] Implement **Core Filtering**: Enable server-side filtering by **Search**, **Status**, and **Date Range** (verified synchronized with backend).
- [x] Implement **High-Fidelity Validation**: Strict Zod enforcement where only **Merchant Name**, **Mobile Number**, and **Email** are mandatory; all other fields are optional to streamline data entry.

## 10. Warehouse Management (Standalone Module)
- [x] Implement a dedicated **Warehouse List Page** using `ListPageLayout` with AG Grid and professional filtering (Search, Status, Date Range).
- [x] Implement **Column Visibility Toggle**: Allow users to show/hide specific columns (SL, Warehouse Code, Name, Contact Person, City, Phone, Email, Status).
- [x] Implement separate **Warehouse Create & Edit Pages** with a standalone 3-column card-based layout: **Basic Information**, **Contact Details**, and **Locations Details**.
- [x] Implement **Numeric ID Routing**: Edit page uses numeric ID in the URL (`/inventory/warehouse/edit/$id`) for consistency, while internally utilizing `uuid` for secure API updates.
- [x] Implement **High-Fidelity UI**:
    - Standardized breadcrumb-style titles: `Edit Warehouse [Warehouse Name]`.
    - Integrated standardized loading states with `Loader2` and descriptive text.
    - Clean Topbar navigation that automatically hides numeric IDs for a professional look.
- [x] Implement **Robust Backend Integration**:
    - Updated `WarehouseApiController` to support `getData` by numeric ID.
    - Added comprehensive null-coalescing (`?? null`) to the store/update payload to prevent "Undefined array key" errors.
    - Enforced database transaction integrity with `DB::beginTransaction()` and `DB::commit()`.

## 11. Stock Movement Implementation
- [x] Implement **Stock Movement List Page** with professional filtering and navigation tabs shared with Warehouse Management.
- [x] Implement **Stock Movement Create Page** featuring a sophisticated multi-batch and multi-item management system.
- [x] Implement **Dynamic Batch Loading**: Batches are automatically loaded and filtered based on the selected "From Warehouse".
- [x] Implement **Real-Time Stock Validation**: Validate entry quantities against available stock (`avl_qty`) with high-impact error notifications.
- [x] Implement **Advanced Dropdown Filtering**:
    - **To Warehouse**: Automatically filters out the "From Warehouse" to prevent invalid transfers.
    - **Cross-Batch Filtering**: Prevent selecting the same batch in multiple batch cards.
    - **Intra-Batch Product Filtering**: Prevent selecting the same product multiple times within a single batch card.
- [x] Implement **Automated Form State Management**:
    - Changing the "From Warehouse" automatically resets all batches and items.
    - Changing a Batch automatically resets its associated item list.
- [x] Implement **Post-Save Form Reset**: Upon successful submission, the form resets to its initial empty state for continuous data entry.
- [x] Implement **Strict Submission Integrity**: Final duplicate check at the submission layer to ensure data consistency across complex nested structures.

## 12. Product Management (Category, Sub-Category, Unit)
    - **Unit Management**:
    - Implement `UnitListPage` with professional filtering (Search, Status, Date Range).
    - Implement **Status Toggle**: Functional `ToggleLeft`/`ToggleRight` icons in the list for real-time status updates with loading feedback.
    - Implement `UnitModal` for quick CRUD operations.
- [x] **Category & Sub-Category Management**:
    *   **Performance Optimization**: Refactored `ProductCategoryApiController` to use direct SQL queries for root-level categories, ensuring high performance even with large datasets.
    *   **Hierarchical Visualization**: Implemented a two-column management strategy. The "Category" tab shows root-level nodes, while the "Sub-Category" tab displays the full breadcrumb path (e.g., `Parent | Sub > Child`).
    *   **Recursive Selection**: Updated the Select2 API to recursively fetch all descendants with formatted paths for intuitive product categorization.
    *   **Dynamic UI**: Integrated real-time status toggling and advanced date/status filtering in the list view.

- [x] **Purchase Management**:
    *   **High-Fidelity Form Redesign**: Implemented a standalone, ultra-professional Purchase Create/Edit experience with 32px rounded cards, sticky payment summaries, and nested item-to-warehouse allocations matching visual samples exactly.
    *   **Custom UI Components**: Built specialized components for Invoice Upload (green rounded button), expandable Item Detail cards with blue sub-headers, and dashed-border "Add Item" containers.
    *   **Real-time Calculations**: Built a synchronous calculation engine for line-item totals, sub-totals, discounts, and due amounts with sophisticated visual feedback (red balance indicators).
    *   **Data Transformation**: Handled seamless flattening of nested frontend state into the structure required by the legacy Laravel API.
    *   **Asynchronous Validation**: Integrated real-time debounced checks for Chalan and Batch number uniqueness.
    *   **Vendor Integration**: Implemented supplier-locked product selection with automatic rate and stock fetching.
    *   **High-Fidelity List View**: Built a professional list page with side-by-side Vendor/Status filters, standardized column formatting (plain text IDs, clean dates), and status badges.
    *   **Robust Backend Integration**:
        *   Updated `PurchaseApiController` to include a `delete` method for safe removal of purchases, details, batches, and accounting vouchers.
        *   Enforced transaction integrity and approval checks during the deletion process.
    *   **High-Fidelity Invoice View**: Created a print-ready, branded invoice details page with organizational and supplier context. Specifically optimized for Purchase:
        *   **Header**: Displays system Invoice ID prominently.
        *   **Status Badges**: Grouped Payment Status, Chalan Number, and Batch Number side-by-side for quick reference.
        *   **Print**: Fully optimized for single-page physical output with auto-exclusion of web UI elements.
- [x] **Category & Sub-Category Management**:
    - **Dual-View System**: Separate list pages for Categories (root level) and Sub-Categories (nested levels) using the same component logic.
    - **Status Toggling**: Integrated status toggle buttons in the list view for both categories and sub-categories.
    - **Date Tracking**: Added a formatted "DATE" column and server-side date range filtering.
    - **Hierarchical Display**: 
        - Category list shows plain names for root items.
        - Sub-category list strips hierarchical prefixes (`=>`) for a clean look but keeps parent category context.
        - Modal dropdowns use hierarchical prefixes (`-- `) to clearly visualize the tree structure during parent selection.
    - **Context-Aware Modal**: 
        - **Parent Category Field**: Automatically hidden when editing root categories to prevent invalid self-parenting or structural errors.
        - **Sub-Category Mode**: Parent selection is mandatory and always visible when creating/editing sub-categories.
    - [x] **Backend Synchronization**: Refactored `ProductCategoryApiController` to support tree traversal, post-processing filters (Status, Date, Search), and partial updates for status toggling.

    ## 13. Service Management (Master Data)
    - [x] Implement a dedicated **Service List Page** using `ListPageLayout` with AG Grid and professional filtering.
    - [x] Implement **Status Toggle Modal**: Create and Edit services using a high-fidelity modal with a visual toggle switch for status.
    - [x] Implement **Core Filtering**: Enable server-side filtering by **Search**, **Status**, and **Date Range** (creation date).
    - [x] Implement **Column Visibility Toggle**: Allow users to show/hide specific columns (SL, Date, Service Name, Charge, VAT, Status, Description, Action).
    - [x] Implement robust Zod validation ensuring Service Name and Charge are mandatory while allowing nulls for description and VAT from legacy data.
    - [x] Integrate with legacy backend `/api/inventory/service` API for all CRUD operations.

## 14. Service Invoice Management (Transactions)
- [x] Implement a dedicated **Service Invoice List Page** with navigation tabs ("Manage Service", "Manage Service Invoice").
- [x] Implement **High-Fidelity Form Design**: Separate Create and Edit pages matching visual samples exactly, using a 7/5 grid ratio.
- [x] Implement **Dynamic Items Table**: Support adding/removing multiple service items with real-time row-level calculations (Qty * Charge - Discount + VAT).
- [x] Implement **Synchronous Calculation Engine**: Real-time aggregation of Sub Total, Total Discount, Total VAT, Grand Total, and Remaining Balance.
- [x] Implement merchant-specific logic: Auto-fetch previous due balances upon selection.
- [x] **Persistent Selection Logic**: Ensured selected Merchants, Employees, and Services remain visible in `Select2` dropdowns even when search terms are cleared or on initial page load (Edit mode).
- [x] Integrate **Rich Text Editor** for high-fidelity Sale Details.
- [x] Implement **High-Fidelity View Page**: Read-only invoice details matching the **Sale View Page** design, featuring professional billing cards, status badges, and comprehensive print support.
- [x] **Backend Integration**: 
    - Added `showServiceInvoice` and updated `updateServiceInvoice` in `ServiceApiController` to support numeric ID lookups while maintaining internal UUID integrity.
    - Updated backend datatable logic to support Status and Date Range filtering for service invoices.

## 15. Routing & Parameter Standardization (Project-Wide)
- [x] **Consistently use `$id` as the URL parameter name** across all modules (Merchant, Product, Sale, Purchase, Vendor, Warehouse, Contact Us, Service Invoice) for Edit and View routes.
- [x] Ensure all route files in `erp_frontend/src/routes/_authenticated/inventory` are named using the `.$id.tsx` pattern.
- [x] **Numeric ID for SEO/URLs**: Use numeric IDs in the visible browser URL to maintain a clean and standardized navigation experience.
- [x] **UUID for Security**: Pass the record's UUID string as the value for the `$id` parameter when required by the backend API, ensuring high data integrity for updates and deletions.
- [x] **Project-Wide Audit**: Verified that all `useParams` calls destructure `id` only, and all `navigate` calls use the `id` key in the `params` object.


