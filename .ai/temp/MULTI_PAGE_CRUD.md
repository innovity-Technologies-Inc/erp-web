# Technical Documentation: Multi-Page (Workflow-Based) CRUD Process

This document outlines the standard architecture for a multi-page CRUD (Create, Read, Update, Delete, View) module within the ERP frontend, using the **Inventory Sales** module as the reference implementation.

## 1. Architectural Overview
The pattern follows a **Decoupled Workflow Layout** where major actions happen on dedicated routes. This is ideal for complex transactions requiring large tables, real-time calculations, and high-fidelity print views.

### Core Technologies
- **UI Framework:** React 19 (TypeScript) + TanStack Router (File-based routing)
- **Data Fetching:** TanStack Query v5 + Axios
- **Form Management:** React Hook Form + Zod (Strict schema validation)
- **State Management:** Zustand (for global settings and notifications)
- **Design:** Tailwind CSS (Custom branding variables) + Poppins Typography

---

## 2. File Structure (Reference: Inventory Sales)
```text
src/modules/inventory/
├── api/
│   └── sales.api.ts       # Specialized Axios calls (create, getDetails, update, datatable)
├── hooks/
│   ├── useSales.ts        # TanStack Query hooks (useSalesDatatable, useSaleDetails, useUpdateSale)
│   └── validation.ts      # Zod schemas (saleSchema)
└── views/
    ├── SalesListPage.tsx  # Index view (AG Grid + ListPageLayout)
    ├── SaleCreatePage.tsx # Workflow Create Page
    ├── SaleEditPage.tsx   # Workflow Edit Page (Pre-populated)
    └── SaleViewPage.tsx   # Read-only Invoice View (Print ready)
```

---

## 3. Engineering & Design Standards (STRICT)

### 3.1 Typography (Poppins)
- **Font Family**: Always use **Poppins**.
- **Font Weight**: 
  - Use **font-medium** for labels, inputs, and general body text.
  - Use **font-semibold** for section titles and important table values.
  - Use **font-bold** or **font-black** ONLY for primary headers and high-impact totals.
- **Standard Sizes**: `12px - 15px` for workflow forms, `20px - 32px` for Page Titles and totals.

### 3.2 Action Button Standards
- **Form Actions**:
  - **Save/Update**: `px-8 h-10 bg-[#059669] hover:bg-[#047857] text-white font-medium rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2`.
  - **Cancel/Reset**: `px-6 h-10 bg-white border border-gray-200 text-[#64748b] font-medium rounded-lg hover:bg-gray-50 shadow-sm`.
- **Table Icons**:
  - **View**: `p-2 hover:bg-blue-50 text-[#1e4ba1] rounded-xl transition-all border border-transparent hover:border-blue-100 hover:scale-110`.
  - **Edit**: `p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110`.
  - **Delete**: `p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110`.

### 3.3 Page Header Standards
- **Style B: Transaction Header (No Tabs)**:
  - **Used in**: `SaleCreatePage.tsx`, `VendorCreatePage.tsx`, etc.
  - **Structure**:
    - **Container**: `max-w-[1600px] mx-auto px-2 py-4`.
    - **Back Button**: Branded box style (`bg-white border-gray-100 rounded-lg text-gray-400 hover:text-[#1e4ba1] shadow-sm`) with a thick `strokeWidth={3}` icon.
    - **Title**: Standardized to `text-[20px] font-medium text-[#1e4ba1]`.

### 3.4 Notification & Feedback Strategy
We use the global `NotificationModal` (via `showNotificationModal` in `useUiStore`) for high-impact feedback:
- **Success**: Large success icon + "Transaction Completed" message.
- **Error**: Large error icon + Server-side validation message list.

---

## 4. Real-Time Calculation Engine
Multi-page modules often involve complex math (e.g., Sales totals).

- **Implementation**: Uses the `useWatch` hook from React Hook Form for zero-lag reactivity.
- **Sync Logic**: Calculations for row-totals, grand totals, and remaining balances are derived synchronously within a `useMemo` block.
- **Defensive Submission**: The `onSubmit` handler performs a final recalculation to ensure the API payload is mathematically perfect regardless of UI state.

---

## 5. Hydration & Smooth Loading
To prevent UI flickering during data loading (especially in `Edit` and `View` modes):

1. **Wait for Dependencies**: The form remains hidden behind a branded `Loader2` screen until all primary data (Sale Details) and secondary data (Product Batches, Units, available quantities) are fully fetched and mapped.
2. **Auto-Sync Hook**: `ItemRow` components use internal `useEffect` hooks to grab the latest stock levels from fresh batch caches as soon as the Product/Batch IDs are hydrated.

---

## 6. Notification & Feedback Strategy
We use the global `NotificationModal` (via `showNotificationModal` in `useUiStore`) for high-impact feedback:

- **Success**: Large success icon + "Sale Updated Successfully" message.
- **Error**: Large error icon + Server-side validation message list.

---

## 7. Print & Report Optimization
Dedicated `View` pages are optimized for physical printing:

- **Dynamic Data**: All logo and billing info are pulled from `useSettings()` to ensure branding matches the current organization.
- **Print Overrides**: CSS `@media print` rules are used to hide navigation elements, flatten rounded corners, and ensure pure white backgrounds for ink-saving and professional looks.

---

## 8. Development Checklist for Workflow Modules
1. [ ] Define parameterized routes in `src/routes/`.
2. [ ] Map complex Laravel relationships (e.g., `InvoiceDetails` vs `invoice_details`) defensively.
3. [ ] Use `useWatch` for real-time form math.
4. [ ] Standardize headers (Back Button + Title, No Tabs).
5. [ ] Implement branded `NotificationModal` for all success events.
6. [ ] Verify `useHydrating` state for smooth page initialization.
