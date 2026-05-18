# Technical Documentation: Single-Page (Modal-Based) CRUD Process

This document outlines the standard architecture for a single-page CRUD (Create, Read, Update, Delete) module within the ERP frontend, using the **Vendor (Supplier)** module as the primary reference implementation.

## 1. Architectural Overview
The pattern follows a **Single Page Layout** where all management actions (Add/Edit/Delete) happen within the same route using Modals. This ensures a fast, app-like experience without full page reloads.

### Core Technologies
- **UI Framework:** React 19 (TypeScript)
- **Data Fetching:** TanStack Query (React Query) v5
- **Form Management:** React Hook Form + Zod (Strict Validation)
- **Grid/Table:** AG Grid Community
- **State Management:** Zustand (for global settings and notifications)
- **Export:** ExcelJS (Professional Excel generation)

---

## 2. File Structure (Reference: Vendor/Supplier)
```text
src/modules/inventory/
├── api/
│   └── suppliers.api.ts   # Axios calls (getDatatable, create, update, delete)
├── hooks/
│   ├── useSuppliers.ts    # TanStack Query hooks (useQuery, useMutation)
│   └── validation.ts      # Zod schemas (supplierSchema)
├── components/
│   └── VendorModal.tsx    # Combined Create/Edit modal
└── views/
    └── VendorListPage.tsx # Main view with DataTable and Advanced Filters
```

---

## 3. Engineering & Design Standards (STRICT)

### 3.1 Typography (Poppins)
- **Font Family**: Always use **Poppins**.
- **Font Weight**: 
  - Use **font-medium** for labels, inputs, and general body text.
  - Use **font-semibold** for section titles and important table values.
  - Use **font-bold** or **font-black** ONLY for primary headers and high-impact totals.
- **Standard Sizes**: `10px - 14px` for UI/Table content, `20px` for Page Titles.

### 3.2 Action Button Standards
- **Table Icons**:
  - **View**: `p-2 hover:bg-blue-50 text-[#1e4ba1] rounded-xl transition-all border border-transparent hover:border-blue-100 hover:scale-110`.
  - **Edit**: `p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110`.
  - **Delete**: `p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110`.
- **Form Actions**:
  - **Save/Update**: `px-8 h-10 bg-[#059669] hover:bg-[#047857] text-white font-medium rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2`.
  - **Cancel/Reset**: `px-6 h-10 bg-white border border-gray-200 text-[#64748b] font-medium rounded-lg hover:bg-gray-50 shadow-sm`.

### 3.3 Notification & Feedback Strategy
We use the global `NotificationModal` (via `showNotificationModal` in `useUiStore`) for high-impact feedback:
- **Success Events**: ALWAYS use the big `NotificationModal` for events like "Vendor Created Successfully".
- **Transient Info**: Use small toast notifications ONLY for background information or non-critical messages.
- **Submission Errors**: Use `NotificationModal` with `variant="error"` for validation lists or server failures.

### 3.3 Page Header Standards
- **Structure**: All Index/List pages must use `ListPageLayout`.
- **Navigation**: Header MUST include navigation tabs to switch between related sub-modules (e.g., Vendor, Sale, Terms).
- **Title Style**: Branded title using `text-[20px] font-medium text-[#1e4ba1]`.

---

## 4. The Read Process (Datatable & Advanced Filtering)
The list view uses `ListPageLayout` which wraps AG Grid and provides a standardized toolbar.

### Dynamic Filtering
The Vendor module extends standard filtering with:
1. **Global Search**: Real-time search across all columns.
2. **Status Filter**: Fast dropdown for Active/Inactive states.
3. **Custom Filters**: Implementation of `extraFilters` for specific criteria like **Country**, **State**, and **City**.
4. **Date Range**: Professional date picker for record creation tracking.

---

## 5. The Create & Edit Process (Single Modal)
A single modal (`VendorModal.tsx`) handles both operations defensively.

### State Flow
1. **Parent State:** `VendorListPage.tsx` tracks `selectedVendorId` and `selectedVendorData`.
2. **Hydration:** The modal uses a `useEffect` to `reset()` the form whenever it opens, ensuring the fields are either empty for "Add" or perfectly populated for "Edit".
3. **Status Management**: Uses branded radio buttons for simple, accessible status toggling.

---

## 6. The Delete Process (Safe Removal)
Instead of `window.confirm`, we use a custom `ConfirmationModal`.

1. **Trigger:** Trash icon sets the target `id` and `uuid`.
2. **Safety:** The message warns about related accounting records to ensure data integrity.
3. **Execution:** The `deleteSupplier` mutation invalidates the 'suppliers' cache, triggering an instant UI refresh.

---

## 7. Development Checklist for New Modules
When creating a new single-page module:
1. [ ] Define API types and axios calls with `uuid` support.
2. [ ] Create TanStack Query hooks with `NotificationModal` integration on success.
3. [ ] Define Zod validation schema (match Laravel backend rules).
4. [ ] Build the Modal component (2-column grid, Poppins font).
5. [ ] Implement `ListPageLayout` with sub-module navigation tabs.
6. [ ] Add `ConfirmationModal` for delete actions.
7. [ ] Ensure SL (Serial Number) follows continuous pagination logic.

