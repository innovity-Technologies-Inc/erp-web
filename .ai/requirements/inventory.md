# Phase 3: Inventory Module Requirements

This document outlines the requirements for the Inventory module in the `erp_frontend` application.

## 1. Sales Terms & Conditions (Modal-Based CRUD)
- [x] Implement terms list view with AG Grid.
- [x] Implement server-side pagination and search for terms.
- [x] Implement "Add Term" modal with Zod validation.
- [x] Implement "Edit Term" modal with proper state reset.
- [x] Implement professional "Delete Confirmation" modal.
- [x] Implement status filter (Active/Inactive).
- [x] Implement Date Range filter with year/month selection.
- [x] Implement professional Excel export (`.xlsx`) with auto-calculated widths.

## 2. Manage Sales (Multi-Page CRUD - List)
- [x] Implement sales list view with ListPageLayout.
- [x] Integrate server-side filtering (Search, Status, Date Range).
- [x] Implement navigation-based Create and Edit triggers.
- [x] Implement professional "Delete Confirmation" modal for invoices.
- [x] Implement professional Excel export for sales data.
- [x] Customize table columns: SL, Invoice No, Sales By, Channel, Merchant Name, Date, Delivery Note, Total Amount, Voucher Status, Action.
- [x] Map "Approved" and "Not Approved" status labels to backend voucher approval logic.

## 3. Manage Contact Us (Two-Column Reply Page)
- [x] Implement contact messages list view with AG Grid and `ListPageLayout`.
- [x] Integrate server-side search and date range filtering.
- [x] Implement a dedicated **Two-Column Reply Page**:
    - **Left Column**: Client Info (ID, Name, Email, Phone) and Original Message (with Quote decoration).
    - **Right Column**: Compose Reply interface with a large professional textarea.
- [x] Implement "Reply Once" logic: hide the compose form and show previous reply if the message is already responded.
- [x] Implement "Discard" with a professional confirmation modal.
- [x] Ensure specific date formatting: "Month Day, Year · Time" (e.g., October 24, 2023 · 10:45 AM).
- [x] Standardize Client ID padding to 6 digits (e.g., #000001).

## 4. Invoice Payment List (Advanced Filtering)
- [x] Implement invoice payments list view using `ListPageLayout`.
- [x] Implement advanced server-side filtering:
    - **Search**: Global text search.
    - **Approved By**: Dynamic dropdown populated from system users.
    - **Status**: Dropdown for Approved, Pending, Unapproved.
    - **Date Range**: Filter by invoice date.
- [x] Standardize column renderers for amounts (bold, currency-formatted) and statuses (color-coded badges).
- [x] Implement professional Excel export stripping HTML from transaction references and statuses.

## 5. UI/UX Standards
- [x] Standardize on primary branded borders (`border-[#1e4ba1]/20`).
- [x] Use `ConfirmationModal` for all destructive actions.
- [x] Use `NotificationModal` (Big Success Modal) for all success messages.
- [x] Use Toast notifications strictly for background info and error reporting.
- [x] Ensure pagination footer accurately reflects `recordsFiltered`.
- [x] Implement **Continuous Serial Numbers (SL)**: Serial numbers must follow across pages (e.g., 1-10 on page 1, 11-20 on page 2).
- [x] Implement **Navigation Synchronization**: The Sidebar "Sale" item must remain active when navigating through sub-modules like Terms, Contact Us, and Sales Payments.

## 6. Sales Transaction (Create/Edit)
- [x] Implement dynamic warehouse-based product loading (must select warehouse before product).
- [x] Implement **Synchronous Calculation Engine**: Eliminate lag by calculating row totals and grand totals in real-time from raw inputs.
- [x] Implement a professional **Rich Text Editor** for Sale Details with support for Bold, Italic, Underline, Lists, Links, and Images.
- [x] Implement merchant-specific logic: Auto-fetch phone numbers and previous due balances upon selection.
- [x] Implement payment logic: Automatically reset paid amount to 0 for "Credit Sale" payment types.
- [x] Standardize on a professional multi-column header and interactive item table layout.
- [x] Implement robust Zod validation for complex nested item structures.
- [x] Implement **Sale Edit functionality** (`SaleEditPage`) replicating the Create design while seamlessly fetching, hydrating, and updating existing invoice data safely without touching legacy backend code.
- [x] Implement a professional **Sale View Page** (`SaleViewPage`) matching the reference design, featuring pro-style billing cards, interactive status badges, a comprehensive payment summary, and high-fidelity print capabilities.

## 7. Vendor Management (Standalone Workflow)
- [x] Implement a dedicated **Vendor List Page** using `ListPageLayout` with AG Grid and professional filtering.
- [x] Implement **Core Filtering**: Enable server-side filtering by **Search**, **Status**, and **Date Range** directly in the toolbar.
- [x] Implement **Column Visibility Toggle**: Allow users to show/hide specific columns (SL, Vendor ID, Name, Address, Date, Mobile, Email, Country, State, City, Zip, Status) for a customized view.
- [x] Implement separate **Vendor Create & Edit Pages**: Move away from modals to a decoupled workflow consistent with the Sales module.
- [x] Standardize on a professional multi-card form layout: **Vendor Information**, **Business Address** (spanning 7/12 width), and **Contact Details** (spanning 5/12 width).
- [x] Refine **Contact Details**: Group Contact Person and Phone into a single row, and remove Additional Details field for a cleaner interface.
- [x] Implement robust Zod validation (`supplierSchema`) where only **Vendor Name** is mandatory, making all other fields (mobile, address, etc.) optional to align with backend requirements.
- [x] Integrate with the legacy backend `/inventory/supplier` API for all CRUD operations using `uuid` and `id` mapping.

## 8. Final Design Standards (Project-Wide)
- [x] **Strict Button System**: Standardize all Save/Update (Green), Cancel (White), View (Blue), Edit (Emerald), and Delete (Rose) buttons.
- [x] **Standardized Input System**: All `<input>` and `<textarea>` elements MUST use the standardized focus style (`focus:ring-1 focus:ring-primary/30 focus:border-primary`) and hover style (`hover:border-gray-300`) with smooth transitions.
- [x] **Permission-Based UI**: All actions (Create, Edit, Delete, View) and action columns are strictly controlled by backend permissions.
- [x] **Super-Admin Bypass**: Implemented a global bypass for the `super-admin` role; users with this role have full access regardless of specific permissions, while all other roles are strictly validated.
- [x] **Typography Consistency**: Ensure **Poppins** is the only font family used, with `font-medium` for body and `font-black` for headers.
- [x] **Standardized Headers**: Use **Style A (With Tabs)** for module list pages and **Style B (No Tabs)** for individual transaction pages (Create, Edit, View).
- [x] **High-Impact Feedback**: Mandate the use of `NotificationModal` for all successful system updates.
