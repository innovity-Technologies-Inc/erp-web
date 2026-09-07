# Procurement Frontend Master Architecture & Navigation Plan

## 1. Executive Summary & Design Principles

This plan establishes the architecture, layout system, navigation tabs, and page header dropdowns (`titleOptions`) for the **Procurement Module** in the frontend (`erp_frontend`), adhering strictly to:
- [`erp-react-migration/SKILL.md`](file:///D:/laragon/www/erp_new/erp_frontend/.ai/skills/erp-react-migration/SKILL.md)
- [`GEMINI.md`](file:///D:/laragon/www/erp_new/erp_frontend/GEMINI.md) layout consistency rules
- Existing design patterns seen across **HRM**, **Inventory**, and **Accounting**

---

## 2. Top-Level Module Navigation Tabs (`tabs`)

Every list page inside the Procurement module will render the standard **6 Top Navigation Tabs** at the top of the `<ListPageLayout>`:

| # | Tab Name | Route | Purpose |
| :-: | :--- | :--- | :--- |
| **1** | **Vendors** | `/procurement/vendors` | Vendor master profiles, categorization, compliance documents, and blacklists. |
| **2** | **Requisitions & RFQ** | `/procurement/sourcing` | Purchase requisitions, sourcing requests, vendor bidding, and comparative scoring. |
| **3** | **Purchase Orders** | `/procurement/purchase-orders` | Contractual purchase orders, delivery schedules, amendments, and terms library. |
| **4** | **Goods Receipt (GRN)** | `/procurement/grns` | Warehouse receiving logs against POs, batch allocations, and QC inspection gates. |
| **5** | **Invoices & Payments** | `/procurement/invoices` | 3-Way Matching (PO vs GRN vs Bill), payment requests, and fund disbursements. |
| **6** | **Budgets & Cost Centers** | `/procurement/budgets` | Departmental cost centers, budget allocations, commitments, and fund transfers. |

---

## 3. Tab-by-Tab Page Header Dropdowns (`titleOptions`) & Routing Plan

```text
├── [Tab 1: Vendors] ───────────────► 📂 Header: [Vendor List | Categories | Document Types | Blacklisted]
├── [Tab 2: Requisitions & RFQ] ────► 📂 Header: [Purchase Requisitions | RFQs | Evaluation Templates]
├── [Tab 3: Purchase Orders] ───────► 📂 Header: [PO List | PO Amendments | Terms Library]
├── [Tab 4: Goods Receipt (GRN)] ───► 📂 Header: [GRN List | QC Inspections]
├── [Tab 5: Invoices & Payments] ───► 📂 Header: [Vendor Invoices | Payment Requests]
└── [Tab 6: Budgets & Cost Centers] ─► 📂 Header: [Master Budgets | Categories | Heads | Cost Centers | Transfers]
```

---

### 🔹 Tab 1: Vendors (`/procurement/vendors`)
* **Active Tab:** `Vendors`
* **Page Header Dropdown (`titleOptions`):**
  1. **Vendor List** (`/procurement/vendors`) — Master list with code, name, phone, email, rating, status, and actions.
  2. **Vendor Categories** (`/procurement/vendors/categories`) — Vendor business classification management.
  3. **Document Types** (`/procurement/vendors/document-types`) — Required compliance documents (Trade License, TIN, BIN, etc.).
  4. **Blacklisted Vendors** (`/procurement/vendors/blacklists`) — Audit trail of temporary/permanent vendor blacklists.

#### Associated Action & Transaction Pages:
* `VendorCreatePage.tsx` (`/procurement/vendors/create`) — 12-column grid (`lg:col-span-7` Business Info & Addresses / `lg:col-span-5` Contacts, Banks & Docs).
* `VendorEditPage.tsx` (`/procurement/vendors/edit/$id`) — Pre-populated edit view with relationship synchronization.
* `VendorDetailsPage.tsx` (`/procurement/vendors/view/$id`) — Detailed profile view with tabs/cards for KYC, contacts, bank info, docs, and rating history.

---

### 🔹 Tab 2: Requisitions & RFQ (`/procurement/sourcing`)
* **Active Tab:** `Requisitions & RFQ`
* **Page Header Dropdown (`titleOptions`):**
  1. **Purchase Requisitions (PR)** (`/procurement/sourcing/requisitions`) — Departmental purchase requisitions & approval pipeline.
  2. **Requests for Quotation (RFQ)** (`/procurement/sourcing/rfqs`) — Vendor bidding, quotation collection, and comparative statements.
  3. **RFQ Evaluation Templates** (`/procurement/sourcing/evaluation-templates`) — Technical vs commercial weightage scoring rubrics.

#### Associated Action & Transaction Pages:
* `PurchaseRequisitionCreatePage.tsx` (`/procurement/sourcing/requisitions/create`)
* `PurchaseRequisitionEditPage.tsx` (`/procurement/sourcing/requisitions/edit/$id`)
* `PurchaseRequisitionDetailsPage.tsx` (`/procurement/sourcing/requisitions/view/$id`)
* `RFQCreatePage.tsx` (`/procurement/sourcing/rfqs/create`)
* `RFQDetailsPage.tsx` (`/procurement/sourcing/rfqs/view/$id`)
* `ComparativeStatementPage.tsx` (`/procurement/sourcing/rfqs/$id/comparative-statement`)

---

### 🔹 Tab 3: Purchase Orders (`/procurement/purchase-orders`)
* **Active Tab:** `Purchase Orders`
* **Page Header Dropdown (`titleOptions`):**
  1. **Purchase Order List (PO)** (`/procurement/purchase-orders`) — Official purchase orders issued to vendors.
  2. **PO Amendments** (`/procurement/purchase-orders/amendments`) — Versioned revisions and change logs for approved POs.
  3. **Procurement Terms Library** (`/procurement/purchase-orders/terms`) — Standard payment, shipping, and warranty clause library.

#### Associated Action & Transaction Pages:
* `PurchaseOrderCreatePage.tsx` (`/procurement/purchase-orders/create`)
* `PurchaseOrderEditPage.tsx` (`/procurement/purchase-orders/edit/$id`)
* `PurchaseOrderDetailsPage.tsx` (`/procurement/purchase-orders/view/$id`)
* `PurchaseOrderPrintPage.tsx` (`/procurement/purchase-orders/print/$id`)

---

### 🔹 Tab 4: Goods Receipt (GRN) (`/procurement/grns`)
* **Active Tab:** `Goods Receipt (GRN)`
* **Page Header Dropdown (`titleOptions`):**
  1. **GRN List** (`/procurement/grns`) — Warehouse receiving logs linked to PO schedules.
  2. **QC Inspections** (`/procurement/grns/qc`) — Quality control inspection audits (Pass, Quarantine, Rejection).

#### Associated Action & Transaction Pages:
* `GRNCreatePage.tsx` (`/procurement/grns/create`)
* `GRNDetailsPage.tsx` (`/procurement/grns/view/$id`)
* `QCInspectionModal.tsx` / `QCInspectionPage.tsx` (`/procurement/grns/$id/qc`)

---

### 🔹 Tab 5: Invoices & Payments (`/procurement/invoices`)
* **Active Tab:** `Invoices & Payments`
* **Page Header Dropdown (`titleOptions`):**
  1. **Vendor Invoices** (`/procurement/invoices`) — 3-Way Matching (PO vs GRN vs Vendor Invoice).
  2. **Payment Requests** (`/procurement/invoices/payment-requests`) — Payment approvals, authorization tiers, and disbursements.

#### Associated Action & Transaction Pages:
* `VendorInvoiceCreatePage.tsx` (`/procurement/invoices/create`)
* `VendorInvoiceDetailsPage.tsx` (`/procurement/invoices/view/$id`)
* `PaymentRequestCreatePage.tsx` (`/procurement/invoices/payment-requests/create`)

---

### 🔹 Tab 6: Budgets & Cost Centers (`/procurement/budgets`)
* **Active Tab:** `Budgets & Cost Centers`
* **Page Header Dropdown (`titleOptions`):**
  1. **Master Budgets** (`/procurement/budgets`) — Departmental annual/quarterly budget ledgers and commitment tracking.
  2. **Budget Categories** (`/procurement/budgets/categories`) — Expense category definitions linked to Chart of Accounts (COA).
  3. **Budget Heads** (`/procurement/budgets/heads`) — Specific procurement budget line items.
  4. **Cost Centers** (`/procurement/budgets/cost-centers`) — Business unit cost centers.
  5. **Budget Transfers** (`/procurement/budgets/transfers`) — Fund reallocation requests between heads.

#### Associated Action & Transaction Pages:
* `BudgetCreatePage.tsx` (`/procurement/budgets/create`)
* `BudgetDetailsPage.tsx` (`/procurement/budgets/view/$id`)
* `CostCenterModal.tsx` / `BudgetCategoryModal.tsx` / `BudgetHeadModal.tsx`

---

## 4. Technical File Structure (`src/modules/procurement/`)

```text
src/modules/procurement/
├── api/
│   ├── vendor.api.ts
│   ├── sourcing.api.ts
│   ├── purchaseOrder.api.ts
│   ├── grn.api.ts
│   ├── invoice.api.ts
│   └── budget.api.ts
├── hooks/
│   ├── useVendors.ts
│   ├── useSourcing.ts
│   ├── usePurchaseOrders.ts
│   ├── useGRNs.ts
│   ├── useInvoices.ts
│   └── useBudgets.ts
├── components/
│   ├── vendor/
│   │   ├── VendorCategoryModal.tsx
│   │   ├── VendorDocumentTypeModal.tsx
│   │   └── VendorBlacklistModal.tsx
│   ├── sourcing/
│   ├── purchaseOrder/
│   └── budget/
├── views/
│   ├── vendors/
│   │   ├── VendorListPage.tsx
│   │   ├── VendorCreatePage.tsx
│   │   ├── VendorEditPage.tsx
│   │   ├── VendorDetailsPage.tsx
│   │   ├── VendorCategoryListPage.tsx
│   │   ├── VendorDocumentTypeListPage.tsx
│   │   └── VendorBlacklistListPage.tsx
│   ├── sourcing/
│   ├── purchaseOrders/
│   ├── grns/
│   ├── invoices/
│   └── budgets/
└── index.ts  # Public barrel export
```

---

## 5. UI Implementation Rules & Standards Checklist

- [x] **`<ListPageLayout>`**: All list views wrapped in `<ListPageLayout>` with single horizontal toolbar.
- [x] **Reactive Column Visibility**: AG Grid `columnDefs` with `visibleCols` in `useMemo` dependency array.
- [x] **Permissions**: All buttons guarded via `PermissionGuard` and `usePermissions` (`view_vendor`, `create_vendor`, `edit_vendor`, `delete_vendor`).
- [x] **High-Fidelity 12-Column Grid**: Create and Edit forms use `grid grid-cols-1 lg:grid-cols-12 gap-6` (Left: `lg:col-span-7`, Right: `lg:col-span-5`).
- [x] **Standard Buttons**: Primary green (`bg-[#059669]`), secondary gray (`bg-white text-[#64748b] border border-gray-200`), action icons with `hover:scale-110`.
- [x] **Discard Protection**: All Create forms prompt `ConfirmationModal` on cancel/back.
- [x] **Feedback**: Successful operations trigger `showNotificationModal` from `useUiStore`.
