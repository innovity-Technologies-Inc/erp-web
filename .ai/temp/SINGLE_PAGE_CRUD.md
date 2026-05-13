# Technical Documentation: Single-Page (Modal-Based) CRUD Process

This document outlines the standard architecture for a single-page CRUD (Create, Read, Update, Delete) module within the ERP frontend, using the **Inventory Terms** module as the reference implementation.

## 1. Architectural Overview
The pattern follows a **Single Page Layout** where all management actions (Add/Edit/Delete) happen within the same route using Modals. This ensures a fast, app-like experience without full page reloads.

### Core Technologies
- **UI Framework:** React 19 (TypeScript)
- **Data Fetching:** TanStack Query (React Query) v5
- **Form Management:** React Hook Form + Zod (Validation)
- **Grid/Table:** AG Grid Community
- **State Management:** Zustand (for UI states like notifications)
- **Export:** ExcelJS (Professional Excel generation)

---

## 2. File Structure (Reference: Inventory Terms)
```text
src/modules/inventory/
├── api/
│   └── terms.api.ts       # Axios client calls (getDatatable, create, update, delete)
├── hooks/
│   ├── useTerms.ts        # TanStack Query hooks (useQuery, useMutation)
│   └── validation.ts      # Zod schemas for form validation
├── components/
│   └── TermModal.tsx      # Combined Create/Edit modal
└── views/
    └── TermsListPage.tsx  # Main view with DataTable and Filters
```

---

## 3. The Read Process (Datatable & Filters)
The list view uses `ListPageLayout` which wraps AG Grid and provides a standardized toolbar.

### Data Fetching
- **Hook:** `useTermsDatatable(params)`
- **Params:** Includes `start`, `length` (pagination), `search`, `status`, `start_date`, and `end_date`.
- **Logic:** The `params` object is memoized. Any change to filters or pagination triggers an automatic background re-fetch via React Query.

### Advanced Filtering
1. **Search:** Real-time text search across all columns.
2. **Status Filter:** Dropdown to filter by 'Active' or 'Inactive'.
3. **Date Range Picker:** Custom component with year/month dropdowns. Sends `start_date` and `end_date` to the API.

---

## 4. The Create & Edit Process (Single Modal)
A single modal (`TermModal.tsx`) handles both operations based on whether a `termId` is passed.

### State Flow
1. **Parent State:** `TermsListPage.tsx` tracks `selectedTermId` and `selectedTermData`.
2. **Opening for Create:** `selectedTermId` is set to `null`, `selectedTermData` to `null`.
3. **Opening for Edit:** `selectedTermId` is set to the item ID, and `selectedTermData` is populated with the row's values.
4. **Form Reset:** The modal uses a `useEffect` to `reset()` the form whenever it opens, ensuring fresh data or a clean slate.

### Validation
Zod schema ensures:
- `description` is required (min 3 chars).
- `status` is a valid number (0 or 1).

---

## 5. The Delete Process (Professional Confirmation)
Instead of `window.confirm`, we use a custom `ConfirmationModal`.

1. **Trigger:** Clicking the trash icon sets `selectedTermId` and opens `isConfirmOpen`.
2. **Modal UI:** Displays a danger variant with a "Yes, Delete" button and a "Cancel" button.
3. **Execution:** The `confirmDelete` function calls the `deleteTerm` mutation.
4. **Loading State:** The "Yes, Delete" button shows a spinner while the API call is pending.

---

## 6. Notifications System
We use a dual-layer notification strategy:

1. **Big Notification Modal:** Used for **Success** events (Saved/Updated/Deleted successfully). It provides high visual impact with a large icon and "Ok" button.
2. **Toast Notifications:** Used for **Errors** or background info. These appear at the top-right and vanish after 5 seconds.

**Standard Rule:** Components trigger the Success Modal; Hooks (`useTerms.ts`) trigger the Error Toasts.

---

## 7. Professional Excel Export
Managed via `exportToExcel` utility in `src/utils/exportUtils.ts`.

- **Format:** Generates `.xlsx` files (not CSV).
- **Auto-Width:** Columns are automatically sized so dates/text are never hidden (`#####`).
- **Styling:** Branded headers (Primary color), borders, and centered alignment.
- **Date Handling:** Values are converted to JS `Date` objects, and Excel is told to format them as `dd/mm/yyyy`.

---

## 8. Development Checklist for New Modules
When creating a new single-page module:
1. [ ] Define API types and axios calls.
2. [ ] Create TanStack Query hooks (invalidate queries on success).
3. [ ] Define Zod validation schema.
4. [ ] Build the Modal component (handle Add/Edit logic).
5. [ ] Implement `ListPageLayout` with necessary filters.
6. [ ] Add `ConfirmationModal` for delete actions.
7. [ ] Configure `exportToExcel` for the data columns.

