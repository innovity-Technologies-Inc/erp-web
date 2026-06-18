# Completed Modules Registry

This document lists all modules and features that have been officially marked as **DONE** by the user. 

### 🛑 CRITICAL MANDATE
Files belonging to the modules listed below are considered **STABILIZED**. 
- **DO NOT** modify, refactor, or "touch" these files in future tasks.
- **DO NOT** apply "just-in-case" updates or cleanups to these directories.
- Any change to these modules **REQUIRES EXPLICIT USER PERMISSION**.

---

## ✅ Completed Modules

### 1. Sales Module (Inventory)
- **Status**: COMPLETED (June 14, 2026)
- **Scope**:
  - `SaleCreatePage.tsx`: RichEditor integration, Stock validation (avl_qty), Payment validation (Grand Total limit), Row-total sync fix.
  - `SaleEditPage.tsx`: RichEditor integration, Batch visibility logic (with_zero_qty for existing items), Payment validation, Row-total sync fix.
  - `SalesListPage.tsx`
  - `SaleViewPage.tsx`
  - `InvoicePaymentListPage.tsx`
  - `InvoicePaymentViewPage.tsx`
  - `TermsListPage.tsx`
  - `ContactUsListPage.tsx`
  - `ContactUsReplyPage.tsx`
- **Location**: `erp_frontend/src/modules/inventory/views/sales/`

### 2. Vendor Module (Inventory)
- **Status**: COMPLETED (June 14, 2026)
- **Scope**:
  - `VendorCreatePage.tsx`: Standard UI layout, Validation integration.
  - `VendorEditPage.tsx`: Data hydration, Standard UI layout.
  - `VendorListPage.tsx`: AG Grid integration.
- **Location**: `erp_frontend/src/modules/inventory/views/vendors/`

### 3. Product Module (Inventory)
- **Status**: COMPLETED (June 14, 2026)
- **Scope**:
  - `ProductCreatePage.tsx`: Standard UI layout, Category & Vendor integration.
  - `ProductEditPage.tsx`: Data hydration, Image handling.
  - `ProductListPage.tsx`: AG Grid integration, Category filtering.
  - `ProductDetailsPage.tsx`: Visual layout, Stock overview.
- **Location**: `erp_frontend/src/modules/inventory/views/product/`

### 4. Warehouse Module (Inventory)
- **Status**: COMPLETED (June 14, 2026)
- **Scope**:
  - `WarehouseCreatePage.tsx`: Standard UI layout, Validation integration.
  - `WarehouseEditPage.tsx`: Data hydration, Standard UI layout.
  - `WarehouseListPage.tsx`: AG Grid integration.
  - `StockMovementCreatePage.tsx`: Multi-warehouse stock transfer logic.
  - `StockMovementListPage.tsx`: AG Grid integration.
- **Location**: `erp_frontend/src/modules/inventory/views/warehouse/`

### 5. Merchant Module (Inventory)
- **Status**: COMPLETED (June 14, 2026)
- **Scope**:
  - `MerchantCreatePage.tsx`: Standard UI layout, Validation integration.
  - `MerchantEditPage.tsx`: Data hydration, Standard UI layout.
  - `MerchantListPage.tsx`: AG Grid integration.
- **Location**: `erp_frontend/src/modules/inventory/views/merchant/`

### 6. Service & Service Invoice Modules (Inventory)
- **Status**: COMPLETED (June 14, 2026)
- **Scope**:
  - `ServiceListPage.tsx`: AG Grid integration.
  - `ServiceFormModal.tsx`: Detailed error handling (getErrorMessage).
  - `ServiceInvoiceListPage.tsx`: AG Grid integration.
  - `ServiceInvoiceForm.tsx`: Sub-component architecture, Item filtering, Synchronous summary sync, Payment & Qty validation.
  - `ServiceInvoiceViewPage.tsx`: High-fidelity print-ready layout.
- **Location**: 
  - `erp_frontend/src/modules/inventory/views/service/`
  - `erp_frontend/src/modules/inventory/views/service-invoice/`

### 7. Quotation Module (Inventory)
- **Status**: COMPLETED (June 14, 2026)
- **Scope**:
  - `QuotationForm.tsx`: High-fidelity layout, Items & Service dual-section logic, **Description field read-only**, Real-time summary synchronization, Add to Invoice functionality.
  - `QuotationListPage.tsx`: AG Grid integration.
  - `QuotationDetailsPage.tsx`: Print-ready view.
  - `CreateQuotationPage.tsx` / `EditQuotationPage.tsx` / `AddQuotationToInvoicePage.tsx`: Specialized routing wrappers.
- **Location**: `erp_frontend/src/modules/inventory/views/quotation/`

---

*Note: When a new module is declared complete, add it to this list and uphold the "Do Not Touch" mandate.*
