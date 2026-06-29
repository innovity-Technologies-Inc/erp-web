# Account Module Tasks

## Debit Voucher Migration

- [x] **API Client Module**
  - [x] Create `debit-voucher.api.ts` defining datatable, CRUD, and select2 endpoints.
- [x] **React Query Hooks**
  - [x] Create `useDebitVoucher.ts` for datatable query, details query, CRUD mutations, and select2 queries.
- [x] **Voucher List View**
  - [x] Create `DebitVoucherListPage.tsx` utilizing `ListPageLayout`.
  - [x] Configure AG Grid columns (SL, V. No, Date, Remark, Amount, Status).
  - [x] Implement Details Modal with signature blocks and print support.
  - [x] Implement Delete action with ConfirmationModal.
  - [x] Add Status filter dropdown to the List View.
  - [x] Register list page route in TanStack Router.
- [x] **Voucher Create View**
  - [x] Create `DebitVoucherCreatePage.tsx`.
  - [x] Setup Credit Account selector and toggle cheque/bank fields dynamically.
  - [x] Setup dynamic debit grid with account selectors and dynamic sub-type fetching.
  - [x] Implement running totals.
  - [x] Implement validation checks (mandatory inputs and valid items check) with smooth scroll to error.
  - [x] Implement Discard Protection confirmation modal.
  - [x] Register create page route in TanStack Router.
- [x] **Voucher Edit View**
  - [x] Create `DebitVoucherEditPage.tsx`.
  - [x] Fetch voucher details by UUID (enabled by backend show API update).
  - [x] Map balanced transaction entries to separate credit head and debit rows.
  - [x] Pre-load and map sub-ledger options for edit grid lines.
  - [x] Register edit page route in TanStack Router.

## Opening Balance Migration & Enhancements
- [x] Add Account Name and Sub Type filters to `OpeningBalanceListPage.tsx`.
- [x] Verify API matches and client-side filtering synchronization works.

## Account Sub Type Migration
- [x] Create `sub-type.api.ts` defining datatable API request.
- [x] Create query hook `useSubTypeDatatable` in `useSubType.ts`.
- [x] Create read-only listing page `SubTypeListPage.tsx` utilizing `ListPageLayout` and AG Grid.
- [x] Register route `account.sub-type.tsx` in TanStack Router.


