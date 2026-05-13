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

## 3. UI/UX Standards
- [x] Standardize on primary branded borders (`border-[#1e4ba1]/20`).
- [x] Use `ConfirmationModal` for all destructive actions.
- [x] Use `NotificationModal` (Big Success Modal) for all success messages.
- [x] Use Toast notifications strictly for background info and error reporting.
- [x] Ensure pagination footer accurately reflects `recordsFiltered`.
