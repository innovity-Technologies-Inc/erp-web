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
