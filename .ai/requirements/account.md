# Account Module Requirements (React migration)

## 1. Debit Voucher
Migrate the existing Laravel Blade Debit Voucher CRUD to a decoupled React Single Page Application (SPA).

### **Debit Voucher List Page**
- **Grid Layout:** Standard index page using `ListPageLayout` and AG Grid.
- **Fields Displayed:** V. No, Date, Remark, Total Amount, Status.
- **Status Badges:** Dynamic colors (Emerald for Approved, Amber for Pending).
- **Date Range Filter:** Dynamic filtering using the master DateRangePicker.
- **Actions:**
  - **Show Details (Eye):** Displays voucher ledger detail in a modal with prepared signature blocks and a print button.
  - **Edit (Pencil):** Opens the Edit view (only if not approved).
  - **Delete (Trash):** Triggers a ConfirmationModal to delete the voucher (only if not approved).

### **Debit Voucher Create Page**
- **Header Card:**
  - Voucher Type (Read-only "Debit").
  - Credit Account Head Selector (Select2 from `/api/select2/get-credit-account-head-select2`).
  - Date Picker (defaults to current date).
  - Check details (Check No, Check Date, Is Honours) - dynamically shown only when the credit account has `is_bank_nature = 1`.
  - Remark/Narration Textarea.
- **Transaction Grid (Debit Lines):**
  - Account Name Selector (Select2 from `/api/select2/transection-head-select2`).
  - Sub Type Selector (dynamic options fetched on Account selection via `/api/account/chart-of-account/get-sub-type-code/{id}`).
  - Ledger Comment.
  - Amount input.
  - Actions (Add row / Remove row).
  - Calculated Grand Total sum footer.
- **Validation:**
  - Mandatory fields check (Credit Account, Date, Remark, items).
  - Valid line item check (requires at least one row with Account selected and Amount > 0).
  - Scroll-to-error on validation failures.
- **Discard Protection:** Warns users via a ConfirmationModal if they attempt to exit the page with unsaved modifications.

### **Debit Voucher Edit Page**
- Exempt from discard protection but preserves form logic.
- Splits the balanced backend items:
  - Extracts the credit head (`credit > 0`) for the header.
  - Populates the dynamic debit rows (`debit > 0`) in the line items grid.
  - Pre-fetches and maps sub-ledger options for all populated debit items.
