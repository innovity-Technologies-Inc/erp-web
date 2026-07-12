# Accounts Module Reports Analysis & Documentation

This document logs the details of each report in the Accounts module, arranged in the exact order of the frontend menu (`cashReportOptions` inside [constants.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/constants.ts)). 

For each report, it outlines:
1. **Report Name & Component**
2. **Purpose & Visual Layout**
3. **Frontend API Calls & Hooks**
4. **Backend API Logic (Tables & Queries)**
5. **Validation & Operational Status**

---

## 1. Cash Book Report

### 1.1 Report Details
- **Component File**: [CashBookReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/CashBookReportPage.tsx)
- **Status**: **OK / Verified**

### 1.2 Purpose & Visual Layout
- **Purpose**: Displays the transactional log (debits, credits, and running balance) of a selected Cash account head within a specified date range. It can be filtered by voucher type (DV, CV, JV, CT).
- **Layout**:
  - **Toolbar (Filters)**:
    - `Select2` dropdown for selecting the **Cash Head** (populated from all available cash heads where `is_cash_nature = 1`).
    - `Select2` dropdown for filtering by **Voucher Type** (DV, CV, JV, CT).
    - `DateRangePicker` for range filtering.
  - **Search Input**: Full-text search matching Voucher No, Ledger Comment, Debit, or Credit.
  - **AG Grid Table**: Displaying columns: SL, Date, Voucher No, Voucher Type, Head Name (the counter-party ledger head), Ledger Comment, Debit, Credit, and Balance.
  - **Opening Balance Row**: Prepended at index 0, showing the initial cash balance at the start of the date range.
  - **In-Grid Summary Row**: Appended at the bottom of the table, showing total debits and credits for the current page.
  - **Export Buttons**: PDF and Excel buttons using grayscale icons.

### 1.3 Frontend API Integration
- **React Hooks**:
  - `useCashHeads` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts) (to populate the cash selector dropdown).
  - `useCashBookReportDatatable` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
- **API Call Functions**:
  - `getCashHeads` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/cash-heads`).
  - `getCashBookReportDatatable` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/bank-book`). *(Note: Shared query endpoint with Bank Book report).*
- **Parameters**: 
  - `start` (Pagination offset)
  - `length` (Pagination size)
  - `bank_type` (Selected Cash Head Code)
  - `fromDate`
  - `toDate`
  - `voucher_type` (Optional filter)
  - `search` (Search term string)
- **Export Endpoints**:
  - `POST` `/account/report/bank-book-export/{bank_type}` *(Note: Shared export endpoint with Bank Book report).*
  - **Payload**: `{ report_type: 'pdf' | 'excel', fromDate, toDate, voucher_type }` (returns binary blob)

### 1.4 Backend Logic & Database Queries
- **Controller Methods**:
  - `ReportApiController::getCashHeads(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L510) (selects account heads where `is_cash_nature = 1`).
  - `ReportApiController::bankBookDatatable(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L30).
- **API Logic**:
  1. Validates that `bank_type` (the selected Cash Head Code) is provided.
  2. Resolves opening balance using `AccCoa::getOpeningBalance($cmbCode, $dtpFromDate, $dtpToDate)`.
  3. Queries the `acc_transactions` table for the selected cash account code, matching approved entries within the date range.
  4. Resolves counter-party ledger head name using an inner sub-query.
  5. Computes and maps the running balance:
     - For Assets ('A') / Expenses ('E'), balance increases by `debit - credit`.
     - For other head types, balance increases by `credit - debit`.
  6. PDF/Excel exports are handled via `ReportExportController::bank_book_export` with matching logic.

### 1.5 Verification & Status
- **Frontend Code**: Meets design standards. Correctly implements column toggling, pagination, and the Appended In-Grid Summary Row pattern with custom styling.
- **Backend Code**: Shared backend endpoint is highly decoupled and handles cash heads properly.
- **Status**: **OK / Fully Functional**

---

## 2. Bank Book Report

### 2.1 Report Details
- **Component File**: [BankBookReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/BankBookReportPage.tsx)
- **Status**: **OK / Verified**

### 2.2 Purpose & Visual Layout
- **Purpose**: Displays the transactional log (debits, credits, and running balance) of a selected Bank account head within a specified date range. It can be filtered by voucher type (DV, CV, JV, CT).
- **Layout**:
  - **Toolbar (Filters)**:
    - `Select2` dropdown for selecting the **Bank Head** (populated from all available bank heads where `is_bank_nature = 1`).
    - `Select2` dropdown for filtering by **Voucher Type** (Debit Voucher, Credit Voucher, Journal Voucher, Contra Voucher).
    - `DateRangePicker` for range filtering.
  - **Search Input**: Full-text search (Voucher No, Ledger Comment, Debit, Credit) matching.
  - **AG Grid Table**: Displaying columns: SL, Date, Voucher No, Voucher Type, Head Name (the counter-party ledger head), Ledger Comment, Debit, Credit, and Balance.
  - **Opening Balance Row**: A synthetic row prepended at index 0 showing the initial balance at the start of the date range.
  - **In-Grid Summary Row**: Appended at the bottom of the current page, showing totals for Debit and Credit.
  - **Export Buttons**: PDF and Excel buttons using grayscale icons.

### 2.3 Frontend API Integration
- **React Hooks**:
  - `useBankHeads` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts) (to populate the bank selector dropdown).
  - `useCashBookReportDatatable` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
- **API Call Functions**:
  - `getBankHeads` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/bank-heads`).
  - `getCashBookReportDatatable` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/bank-book`).
- **Parameters**: 
  - `start` (Pagination offset)
  - `length` (Pagination size)
  - `bank_type` (Selected Bank Head Code)
  - `fromDate`
  - `toDate`
  - `voucher_type` (Optional filter)
  - `search` (Search term string)
- **Export Endpoints**:
  - `POST` `/account/report/bank-book-export/{bank_type}`
  - **Payload**: `{ report_type: 'pdf' | 'excel', fromDate, toDate, voucher_type }` (returns binary blob)

### 2.4 Backend Logic & Database Queries
- **Controller Methods**:
  - `ReportApiController::getBankHeads(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php) (fetches account heads where `is_bank_nature = 1`).
  - `ReportApiController::bankBookDatatable(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L30).
- **API Logic**:
  1. Validates that `bank_type` (the selected Bank Head Code) is provided.
  2. Resolves opening balance using `AccCoa::getOpeningBalance($cmbCode, $dtpFromDate, $dtpToDate)`.
  3. Prepares a query against the `acc_transactions` table to fetch transactions for that bank code.
     - **Approval Filter**: `acc_transactions.is_approved = 1`.
     - **Date Filter**: `v_date` between `fromDate` and `toDate`.
     - **Voucher Type Filter**: Matches `voucher_type` if provided.
     - **Counter-party Ledger Sub-query**: Selects `head_name` from the opposite transaction leg within the same voucher (using a sub-query on `acc_transactions` matching `v_id` where `coa_id != bank_type`).
  4. Prepends the synthetic "Opening Balance" row with the resolved opening balance value.
  5. Iteratively computes the running balance for transactions:
     - For Assets ('A') / Expenses ('E'), balance increases by `debit - credit`.
     - For other head types, balance increases by `credit - debit`.
  6. Implements Maatwebsite Excel and Snappy PDF exports in `ReportExportController::bank_book_export` using identical database queries and calculations.

### 2.5 Verification & Status
- **Frontend Code**: Meets design standards. Uses `ListPageLayout` correctly, implements visible columns, prepends/appends opening balance and summary rows, and implements the Appended In-Grid Summary Row pattern with custom styling inside `gridOptions.getRowStyle`.
- **Backend Code**: Computes running balances accurately and uses raw sub-queries to fetch the counter-party ledger name.
- **Status**: **OK / Fully Functional**

---

## 3. Day Book Report

### 3.1 Report Details
- **Component File**: [DayBookReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/DayBookReportPage.tsx)
- **Status**: **OK / Verified**

### 3.2 Purpose & Visual Layout
- **Purpose**: Lists all ledger transaction rows recorded in the system for a specified date range. It displays the debit and credit legs of all approved transactions.
- **Layout**:
  - **Toolbar**: 
    - `DateRangePicker` for range filtering.
    - Export buttons for **PDF** and **EXCEL** (using professional gray icons).
  - **Search Input**: Matches Voucher No, Account Name, Ledger Comment, Sub Type, Debit, or Credit.
  - **AG Grid Table**: Displaying columns: SL, Voucher No, Date, Account Name, Ledger Comment, Sub Type (Sub Code Name), Debit, Credit, and Reverse Head (the counter-party ledger head).
  - **In-Grid Summary Row**: Appended at the bottom of the current page, showing totals for Debit and Credit.

### 3.3 Frontend API Integration
- **React Hook**: `useDayBookReportDatatable` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts)
- **API Call Function**: `getDayBookReportDatatable` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts)
- **Request Type**: `GET`
- **Endpoint**: `/account/report/day-book`
- **Parameters**: 
  - `start` (Pagination offset)
  - `length` (Pagination size)
  - `fromDate`
  - `toDate`
  - `search` (Search term string)
- **Export Endpoints**:
  - `POST` `/account/report/day-book-export`
  - **Payload**: `{ report_type: 'pdf' | 'excel', fromDate, toDate }` (returns binary blob)

### 3.4 Backend Logic & Database Queries
- **Controller Method**: `ReportApiController::dayBookDatatable(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L265)
- **API Logic**:
  1. Queries the `acc_transactions` table:
     - **Date Filter**: `v_date` between `fromDate` and `toDate`.
     - **Approval Filter**: `is_approved = 1`.
  2. Joins three tables:
     - `financial_years` (aliased `fy`) to link financial years.
     - `acc_coas` (aliased `ac`) to retrieve the primary account ledger name (`head_name`).
     - `acc_sub_codes` (aliased `sc`) to retrieve the subtype code name.
  3. Uses a raw subquery `SELECT ac2.head_name FROM acc_transactions as at2 JOIN acc_coas as ac2 ON ...` to fetch the counter-party ledger head name (`reverse_head`).
  4. Returns the records with paginated parameters.
  5. PDF and Excel exports are handled via `ReportExportController::day_book_export` using identical database queries.

### 3.5 Verification & Status
- **Frontend Code**: Implements column toggling, pagination, and the Appended In-Grid Summary Row pattern with custom styling inside `gridOptions`. Uses the global currency formatting utility.
- **Backend Code**: Joins are set up properly and raw sub-queries fetch opposing account legs accurately.
- **Status**: **OK / Fully Functional**

---

## 4. General Ledger Report

### 4.1 Report Details
- **Component File**: [GeneralLedgerReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/GeneralLedgerReportPage.tsx)
- **Status**: **OK / Verified**

### 4.2 Purpose & Visual Layout
- **Purpose**: Displays the transactional log (debits, credits, and running balance) of any selected General Ledger (GL) account head (excluding Cash and Bank heads) within a specified date range. It can be filtered by voucher type (DV, CV, JV, CT).
- **Layout**:
  - **Toolbar (Filters)**:
    - `Select2` dropdown for selecting the **Ledger Head** (populated from all available non-cash and non-bank transactional ledger heads).
    - `Select2` dropdown for filtering by **Voucher Type** (DV, CV, JV, CT).
    - `DateRangePicker` for range filtering.
  - **Search Input**: Full-text search matching Voucher No, Ledger Comment, Debit, or Credit.
  - **AG Grid Table**: Displaying columns: SL, Date, Voucher No, Voucher Type, Head Name (the counter-party ledger head), Ledger Comment, Debit, Credit, and Balance.
  - **Opening Balance Row**: A synthetic row prepended at index 0 showing the initial balance at the start of the date range.
  - **In-Grid Summary Row**: Appended at the bottom of the current page, showing totals for Debit and Credit.
  - **Export Buttons**: PDF and Excel buttons using grayscale icons.

### 4.3 Frontend API Integration
- **React Hooks**:
  - `useLedgerHeads` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts) (to populate the ledger selector dropdown).
  - `useCashBookReportDatatable` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
- **API Call Functions**:
  - `getLedgerHeads` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/ledger-heads`).
  - `getCashBookReportDatatable` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/bank-book`). *(Note: Shared query endpoint with Bank/Cash Book reports).*
- **Parameters**: 
  - `start` (Pagination offset)
  - `length` (Pagination size)
  - `bank_type` (Selected Ledger Head Code)
  - `fromDate`
  - `toDate`
  - `voucher_type` (Optional filter)
  - `search` (Search term string)
- **Export Endpoints**:
  - `POST` `/account/report/bank-book-export/{bank_type}` *(Note: Shared export endpoint with Bank/Cash Book reports).*
  - **Payload**: `{ report_type: 'pdf' | 'excel', fromDate, toDate, voucher_type }` (returns binary blob)

### 4.4 Backend Logic & Database Queries
- **Controller Methods**:
  - `ReportApiController::getLedgerHeads(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L528) (selects active accounts from `acc_coas` where `head_level = 4`, `is_cash_nature = 0`, and `is_bank_nature = 0`).
  - `ReportApiController::bankBookDatatable(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L30).
- **API Logic**:
  1. Validates that `bank_type` (the selected Ledger Head Code) is provided.
  2. Resolves opening balance using `AccCoa::getOpeningBalance($cmbCode, $dtpFromDate, $dtpToDate)`.
  3. Queries the `acc_transactions` table for the selected account code, matching approved entries within the date range.
  4. Resolves counter-party ledger head name using an inner sub-query.
  5. Computes and maps the running balance:
     - For Assets ('A') / Expenses ('E'), balance increases by `debit - credit`.
     - For other head types, balance increases by `credit - debit`.
  6. PDF/Excel exports are handled via `ReportExportController::bank_book_export` with matching logic.

### 4.5 Verification & Status
- **Frontend Code**: Meets design standards. Correctly implements column toggling, pagination, and the Appended In-Grid Summary Row pattern with custom styling.
- **Backend Code**: Shared backend endpoint is highly decoupled and handles standard ledger heads properly.
- **Status**: **OK / Fully Functional**

---

## 5. Sub Ledger Report

### 5.1 Report Details
- **Component File**: [SubLedgerReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/SubLedgerReportPage.tsx)
- **Status**: **OK / Verified**

### 5.2 Purpose & Visual Layout
- **Purpose**: Displays the transaction logs (debits, credits, running balance) of a specific sub-code / transaction head nested under a specific general ledger account head and sub-type (e.g. Employee payments, Supplier payments).
- **Layout**:
  - **Toolbar (Cascading Dropdowns)**:
    - `Select2` for selecting the **Sub Type** (e.g., Customer, Supplier, Employee).
    - `Select2` for selecting the **Account Head** (loaded reactively based on Sub Type).
    - `Select2` for selecting the **Transaction Head** (loaded reactively based on Sub Type).
    - `DateRangePicker` for range filtering.
  - **AG Grid Table**: Displays columns: SL, Date, Voucher No, Voucher Type, Head Name, Ledger Comment, Debit, Credit, and Balance.
  - **Opening Balance Row**: Prepended at index 0, showing initial sub-ledger balance.
  - **In-Grid Summary Row**: Appended at the bottom of the table, showing total debits/credits.
  - **Export Buttons**: PDF and Excel buttons using grayscale icons.

### 5.3 Frontend API Integration
- **React Hooks**:
  - `useSubTypes` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
  - `useAccTypeWiseHead` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
  - `useAccHeadWiseTransaction` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
  - `useSubLedgerReportDatatable` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
- **API Call Functions**:
  - `getSubTypes` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/sub-types`).
  - `getAccTypeWiseHead` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/get-acc-type-wise-head/{subTypeId}`).
  - `getAccHeadWiseTransaction` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/get-acc-head-wise-transaction/{subTypeId}`).
  - `getSubLedgerReportDatatable` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/sub-ledger`).
- **Parameters**: 
  - `sub_type_id`, `acc_head_id`, `tran_head_id`, `fromDate`, `toDate`, `start`, `length`.
- **Export Endpoints**:
  - `POST` `/account/report/sub-ledger-export`
  - **Payload**: `{ report_type: 'pdf' | 'excel', sub_type_id, acc_head_id, tran_head_id, fromDate, toDate }` (returns binary blob)

### 5.4 Backend Logic & Database Queries
- **Controller Method**: `ReportApiController::subLedgerDatatable(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L144)
- **API Logic**:
  1. Validates that `sub_type_id`, `acc_head_id`, and `tran_head_id` are provided.
  2. Resolves opening balance for subtype using `AccCoa::getOpeningBalanceSubType`.
  3. Prepares query on `acc_transactions` matching `coa_id = acc_head_id`, `sub_type = sub_type_id`, and `sub_code = tran_head_id` for approved entries inside the date range.
  4. Resolves counter-party ledger name using raw subquery.
  5. Computes running balance:
     - For Assets ('A') / Expenses ('E'), balance increases by `debit - credit`.
     - For other head types, balance increases by `credit - debit`.
  6. PDF/Excel exports are handled via `ReportExportController::sub_ledger_export` using matching queries.

### 5.5 Verification & Status
- **Frontend Code**: Properly resets dependent dropdown values when a parent dropdown selection changes (using `useEffect` handlers). Integrates AG Grid correctly and calculates page totals (excluding the opening balance row).
- **Backend Code**: Database queries correctly join sub-codes and filters are highly accurate.
- **Status**: **OK / Fully Functional**

---

## 6. Trial Balance Report

### 6.1 Report Details
- **Component File**: [TrialBalanceReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/TrialBalanceReportPage.tsx)
- **Status**: **OK / Verified**

### 6.2 Purpose & Visual Layout
- **Purpose**: Displays the general ledger balances (opening, transactional, and closing debit/credit figures) for all active transaction-level accounts to prove the mathematical accuracy of the ledger.
- **Layout**:
  - **Toolbar**: 
    - `DateRangePicker` for range filtering.
    - Export buttons for **PDF** and **EXCEL** (using professional gray icons).
  - **Search Input**: Full-text search matching Account Name or Account Code.
  - **AG Grid Table**: Displays columns: SL, Code, Account Name, and Debit/Credit columns split into:
    - **Opening Balance**: Opening Debit, Opening Credit.
    - **Transactional Balance**: Transactional Debit, Transactional Credit.
    - **Closing Balance**: Closing Debit, Closing Credit.
  - **In-Grid Summary Row**: Appended at the bottom of the table, showing total aggregates for all debit and credit columns.

### 6.3 Frontend API Integration
- **React Hook**: `useTrialBalanceReportDatatable` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
- **API Call Function**: `getTrialBalanceReportDatatable` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/trial-balance`).
- **Parameters**: 
  - `start` (Pagination offset)
  - `length` (Pagination size)
  - `fromDate`
  - `toDate`
  - `search` (Search term string)
- **Export Endpoints**:
  - `POST` `/account/report/trial-balance-export`
  - **Payload**: `{ report_type: 'pdf' | 'excel', fromDate, toDate }` (returns binary blob)

### 6.4 Backend Logic & Database Queries
- **Controller Method**: `ReportApiController::trialBalanceDatatable(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L365)
- **API Logic**:
  1. Selects all active general ledger accounts where `head_level = 4`.
  2. For each head:
     - Calculates opening balance using `AccCoa::getOpeningBalance`.
     - Calculates transactional debits and credits inside the date range using `AccCoa::getGeneralLedgerReport`.
  3. Formulates Debit/Credit balances:
     - For Assets ('A') / Expenses ('E'): Opening is Debit. Closing Debit = `Opening + Debits - Credits`.
     - For other types (Liabilities, Equity, Income): Opening is Credit. Closing Credit = `Opening + Credits - Debits`.
  4. Returns paginated list. (Backend summary row addition is commented out to let the React component render totals dynamically via the Appended In-Grid Summary Row pattern).
  5. Exports PDF and Excel layouts via `ReportExportController::trial_balance_export` matching identical queries.

### 6.5 Verification & Status
- **Frontend Code**: Correctly implements pagination, column visibility, and the Appended In-Grid Summary Row pattern with custom styling inside `gridOptions`. Uses the global currency formatting utility.
- **Backend Code**: Database queries correctly fetch transaction-level heads and calculate balance directions based on head types.
- **Status**: **OK / Fully Functional**

---

## 7. Income Statement Report

### 7.1 Report Details
- **Component File**: [IncomeStatementReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/IncomeStatementReportPage.tsx)
- **Status**: **OK / Verified**

### 7.2 Purpose & Visual Layout
- **Purpose**: Displays a monthly tabular layout comparing Income, Cost of Goods Sold, and Expense balances across the 12 months of a selected financial year.
- **Layout**:
  - **KPI Cards**: Three cards showing **Total Income**, **Gross Profit** (with dynamic profit margin percentages), and **Net Profit**.
  - **Main Table**: A custom horizontal-scrolling tree table:
    - First Column: Account Particulars.
    - Next 12 Columns: Dynamic abbreviation names of the fiscal months (e.g., JUL 26, AUG 26, etc.).
    - Displays detailed income lines, COGS lines, and expense lines grouped with subtotals and page totals for each month.
  - **Toolbar**: Contains a `Select2` dropdown for selecting the **Financial Year**, and Export buttons for **PDF** and **EXCEL**.

### 7.3 Frontend API Integration
- **React Hooks**:
  - `useFinancialYears` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
  - `useIncomeStatementReport` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
- **API Call Functions**:
  - `getFinancialYears` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/financial-years`).
  - `getIncomeStatementReport` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/income-statement`).
- **Parameters**: 
  - `f_year` (Financial Year ID)
- **Export Endpoints**:
  - `POST` `/account/report/income-statement-export`
  - **Payload**: `{ report_type: 'pdf' | 'excel', f_year }` (returns binary blob)

### 7.4 Backend Logic & Database Queries
- **Controller Method**: `ReportApiController::incomeStatementApi(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L562)
- **API Logic**:
  1. Resolves selected financial year ID (defaults to the latest financial year).
  2. Queries `acc_predefine_accounts` to retrieve the Cost of Goods Sold code root (`costs_of_good_solds`).
  3. Queries `acc_monthly_balances` for monthly movements:
     - `getMonthlyIncome` recursively traverses Chart of Accounts (`acc_coas`) under parents `'Income'` (Type `'I'`) and `'Expenses'` (Type `'E'`).
     - For each transaction-level head, it selects the record in `acc_monthly_balances` matching the account code and financial year, extracting the columns `balance1` through `balance12`.
     - `getFromSecondLevelExpenses` processes the COGS account head under type `'E'`.
  4. Returns month-wise incomes, COGS, expenses, settings, and the selected financial year model details (containing the starting date).
  5. Exports PDF/Excel layouts via `ReportExportController::income_statement_export`.

### 7.5 Verification & Status
- **Frontend Code**: Clean layout that dynamically generates the month labels from the backend year's `start_date`, ensuring alignment for custom financial years (e.g. July-June or January-December).
- **Backend Code**: Resolves monthly balances correctly via the monthly balance cache table (`acc_monthly_balances`).
- **Status**: **OK / Fully Functional**

---

## 8. Expenditure Statement Report

### 8.1 Report Details
- **Component File**: [ExpenditureStatementReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/ExpenditureStatementReportPage.tsx)
- **Status**: **OK / Verified**

### 8.2 Purpose & Visual Layout
- **Purpose**: Displays a detailed breakdown of all operating expenses and cost of goods sold recorded during a specific date range.
- **Layout**:
  - **KPI Cards**: Three cards showing **Total Expenses**, **Cost of Goods Sold (COGS)**, and **Overhead Expenses**.
  - **Main Table**: A hierarchical custom HTML table similar to the Balance Sheet Report:
    - Bold uppercase parent expense rows (e.g. `'EXPENSES'`).
    - Secondary grouping levels with their sub-totals (e.g. `'Operating Expenses'`).
    - Individual transactional account rows with their individual expense balances.
    - Grand total row at the bottom.
  - **Toolbar**: Contains `DateRangePicker` and Export buttons (**PDF**, **EXCEL**).

### 8.3 Frontend API Integration
- **React Hook**: `useExpenditureStatementReport` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts)
- **API Call Function**: `getExpenditureStatementReport` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts)
- **Request Type**: `GET`
- **Endpoint**: `/account/report/expenditure-statement`
- **Parameters**: 
  - `fromDate`
  - `toDate`
- **Export Endpoints**:
  - `POST` `/account/report/expenditure-statement-export`
  - **Payload**: `{ report_type: 'pdf' | 'excel', fromDate, toDate }` (returns binary blob)

### 8.4 Backend Logic & Database Queries
- **Controller Method**: `ReportApiController::expenditureStatementApi(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L596)
- **API Logic**:
  1. Calls `getHeadSummary('E', 'Expenses', $dtpFromDate, $dtpToDate, 0)`:
     - Recursively fetches Chart of Accounts (`acc_coas` table) under head type `'E'` (Expenses) with parent name `'Expenses'`.
     - For each transaction-level head, it fetches ledger movements from `acc_transactions` using `AccCoa::getGeneralLedgerReport` within the date range.
     - Computes the balance as `debit - credit`.
  2. Returns the structured hierarchy.
  3. Exports PDF and Excel versions via `ReportExportController::expenditure_statement_export` matching identical queries.

### 8.5 Verification & Status
- **Frontend Code**: Correctly calculates KPI card breakdowns for COGS vs. Overhead by matching code starts with `'401'` or name string pattern. Renders a beautiful hierarchical grid.
- **Backend Code**: Computes expense totals accurately based on debit minus credit ledger entries.
- **Status**: **OK / Fully Functional**

---

## 9. Profit Loss Report

### 9.1 Report Details
- **Component File**: [ProfitLossReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/ProfitLossReportPage.tsx)
- **Status**: **OK / Verified**

### 9.2 Purpose & Visual Layout
- **Purpose**: Displays the Net Profit or Loss (difference between Total Revenue/Income and Total Operating Expenses) for a specified date range.
- **Layout**:
  - **KPI Cards**: Three cards showing **Total Revenue**, **Total Expenses**, and **Net Profit/Loss**.
  - **Main Table**: A hierarchical custom HTML table containing:
    - **Income Section**: Styled with green badges/theme listing details of all revenues, ending with a "Total Income" subtotal row.
    - **Expense Section**: Styled with red badges/theme listing operating costs, ending with a "Total Expenses" subtotal row.
    - **Grand Total Row**: Displays calculated net result at the bottom (formatted in blue).
  - **Toolbar**: Contains `DateRangePicker` and Export buttons (**PDF**, **EXCEL**).

### 9.3 Frontend API Integration
- **React Hook**: `useProfitLossReport` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
- **API Call Function**: `getProfitLossReport` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/profit-loss`).
- **Parameters**: 
  - `fromDate`
  - `toDate`
- **Export Endpoints**:
  - `POST` `/account/report/profit-loss-export`
  - **Payload**: `{ report_type: 'pdf' | 'excel', fromDate, toDate }` (returns binary blob)

### 9.4 Backend Logic & Database Queries
- **Controller Method**: `ReportApiController::profitLossApi(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L614)
- **API Logic**:
  1. Calls `getHeadSummary('I', 'Income', $dtpFromDate, $dtpToDate, 0)` to fetch transactional summaries for all revenue accounts.
  2. Calls `getHeadSummary('E', 'Expenses', $dtpFromDate, $dtpToDate, 0)` to fetch transactional summaries for all expense accounts.
     - *Recall*: `getHeadSummary` retrieves entries in `acc_transactions` matching the date range, adding up debits and credits: `credit - debit` for Income, and `debit - credit` for Expenses.
  3. Returns `incomes` list, `expenses` list, web settings, and company information.
  4. Exports PDF/Excel reports via `ReportExportController::profit_loss_export`.

### 9.5 Verification & Status
- **Frontend Code**: Properly displays loaders, implements print formatting, handles rounding, and calculates net totals reactively. Uses `ListPageLayout` correctly.
- **Backend Code**: Computes correct period transactions. Decoupled calculations are highly reliable.
- **Status**: **OK / Fully Functional**

---

## 10. Balance Sheet Report

### 10.1 Report Details
- **Component File**: [BalanceSheetReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/BalanceSheetReportPage.tsx)
- **Status**: **OK / Verified**

### 10.2 Purpose & Visual Layout
- **Purpose**: Displays the financial position of the company, listing Assets, Liabilities, and Shareholder's Equity. It shows the current year's figures (for the specified date range) and compares them with up to three previous financial years.
- **Layout**:
  - **KPI Cards**: Three cards at the top showing **Total Assets**, **Total Liabilities**, and **Total Equity** dynamically formatted.
  - **Main Table**: Renders a hierarchical multi-level list. The parent headers are styled in a custom color theme, followed by sub-levels (2nd and 3rd levels) and individual transaction-level accounts (4th level) with their respective balances.
  - **Summary Row**: Dark-blue row displaying the calculated totals for each column (current year + past years).
  - **Toolbar**: Contains a `DateRangePicker` and Export buttons (**PDF** and **EXCEL**).

### 10.3 Frontend API Integration
- **React Hook**: `useBalanceSheetReport` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts)
- **API Call Function**: `getBalanceSheetReport` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (HTTP Method: `GET`, Endpoint: `/account/report/balance-sheet`).
- **Parameters**: 
  - `fromDate`
  - `toDate`
- **Export Endpoints**:
  - `POST` `/account/report/balance-sheet-export`
  - **Payload**: `{ report_type: 'pdf' | 'excel', fromDate, toDate }` (returns binary blob)

### 10.4 Backend Logic & Database Queries
- **Controller Method**: `ReportApiController::balanceSheetApi(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L634)
- **API Logic**:
  1. Retrieves `fromDate` and `toDate` from request.
  2. Identifies the current running financial year using `AccCoa::financial_year()`.
  3. Fetches up to three previous financial years by skipping the current one and querying the `financial_years` table.
  4. Resolves the profit/loss account code (`CPL_code`) from the `acc_predefine_accounts` table.
  5. Recursively traverses the Chart of Accounts (`acc_coas` table) under parent head names:
     - **Assets** (Head Type: `'A'`, Parent Head Name: `'Assets'`)
     - **Liabilities** (Head Type: `'L'`, Parent Head Name: `'Liabilities'`)
     - **Shareholder's Equity** (Head Type: `'L'`, Parent Head Name: `'Shareholder\'s Equity'`)
  6. **Traversing Levels**:
     - **Level 1 (Parent)**: e.g., 'Assets'.
     - **Level 2 (Phead)**: e.g., 'Current Assets'.
     - **Level 3 (Head)**: e.g., 'Cash & Cash Equivalents'.
     - **Level 4 (Transaction Head)**: e.g., 'Petty Cash'.
  7. **Balance Calculations** for each transaction head:
     - **Current Balance**: Calculated by adding the opening balance for the date range (using `AccCoa::getOpeningBalance`) to the transactional movement within the range (using `AccCoa::getGeneralLedgerReport` on the `acc_transactions` table).
       - *Assets/Expenses*: `debit - credit`
       - *Liabilities/Equity/Income*: `credit - debit`
     - **Previous Years' Balances**: Queried from the opening balances table (`acc_opening_balances`) matching the specific past financial year ID.
     - **Retained Earnings Adjustment**: If the transaction head matches the pre-defined `CPL_code` (Current Period Profit & Loss), the backend dynamically calculates Net Income for the period:
       $$\text{Net Income} = \text{Income (Type 'I')} - \text{Expenses (Type 'E')}$$
       This Net Income is added to the account's closing balance.
  8. Fetches formatting details from `web_settings` and company details from `company_information` tables.

### 10.5 Verification & Status
- **Frontend Code**: Clean component hierarchy. Uses `ListPageLayout` as a shell but renders a custom scrollable hierarchical table layout since hierarchical reports cannot be natively fit into flat AG Grid grids. Displays loader states and empty states perfectly.
- **Backend Code**: The PHP implementation matches the required parameters and outputs data structurally consistent with the frontend expectations.
- **Status**: **OK / Fully Functional**

---

## 11. Fixed Assets Report

### 11.1 Report Details
- **Component File**: [FixedAssetReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/FixedAssetReportPage.tsx)
- **Status**: **OK / Verified**

### 11.2 Purpose & Visual Layout
- **Purpose**: Displays valuation, additions, deprecation details, and book value (Written Down Value) of corporate fixed assets for a selected financial year.
- **Layout**:
  - **KPI Cards**: Three cards showing **Closing Fixed Assets**, **Accumulated Depreciation**, and **Written Down Value (WDV)**.
  - **Main Table**: A detailed hierarchical custom HTML table containing 12 columns:
    - Sl No, Asset Particulars, Opening Balance (Asset Cost), Additions during the year, Deletions/Adjustments, Closing Balance (Asset Cost), Depreciation Rate (%), Depreciation Expense (Current Year), Accum. Depreciation Opening Balance, Accum. Depreciation Credit, Accum. Depreciation Debit, Accum. Depreciation Closing Balance, and Written Down Value (WDV).
  - **Toolbar**: Contains a `Select2` dropdown for selecting the **Financial Year**, and Export buttons for **PDF** and **EXCEL**.

### 11.3 Frontend API Integration
- **React Hooks**:
  - `useFinancialYears` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts) (to populate the financial year dropdown).
  - `useFixedAssetReport` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
- **API Call Functions**:
  - `getFinancialYears` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/financial-years`).
  - `getFixedAssetReport` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/fixed-assets`).
- **Parameters**: 
  - `f_year` (Financial Year ID)
- **Export Endpoints**:
  - `POST` `/account/report/fixed-assets-export`
  - **Payload**: `{ report_type: 'pdf' | 'excel', f_year }` (returns binary blob)

### 11.4 Backend Logic & Database Queries
- **Controller Method**: `ReportApiController::fixedAssetsApi(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L662)
- **API Logic**:
  1. Resolves selected financial year ID (defaults to current active year).
  2. Queries `acc_predefine_accounts` to fetch the general ledger code for Fixed Assets (`fixed_asset`).
  3. Traverses Chart of Accounts (`acc_coas` table) under head type `'A'` (Assets) starting from the Fixed Asset GL code.
  4. For each transaction-level asset code:
     - Matches linked accumulated depreciation accounts using `asset_code`.
     - Fetches initial balance/opening balance of current year (which is the closing balance of previous year using `getLastYearBalance()`).
     - Queries transaction data from `acc_transactions` within the fiscal year range.
     - Calculates Asset Cost Closing Balance: `Opening Balance + Current Year Debits - Current Year Credits`.
     - Calculates Depreciation Expense: `Closing Balance * Depreciation Rate / 100`.
     - Calculates Closing Accumulated Depreciation: `Opening Accum. Dep. + Current Year Credits - Current Year Debits`.
     - Calculates WDV (Written Down Value): `Asset Cost Closing Balance - Closing Accumulated Depreciation`.
  5. PDF and Excel exports are handled via `ReportExportController::fixed_assets_export` using identical methods.

### 11.5 Verification & Status
- **Frontend Code**: Properly handles null/empty states and maps subtotals for KPIs. Custom table rendering correctly positions multi-column tables.
- **Backend Code**: Intricate formula correctly ties asset entries and deprecation legs together.
- **Status**: **OK / Fully Functional**

---

## 12. Receipt & Payment Report

### 12.1 Report Details
- **Component File**: [ReceiptPaymentReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/ReceiptPaymentReportPage.tsx)
- **Status**: **OK / Verified**

### 12.2 Purpose & Visual Layout
- **Purpose**: Displays cash inflow (Receipts) and cash outflow (Payments) for a specified date range. Reconciles the opening balance (cash, bank, advances) and closing balance (cash, bank, advances) to verify cash movements.
- **Layout**:
  - **KPI Cards**: Four cards showing **Opening Total Balance**, **Total Receipts**, **Total Payments**, and **Closing Total Balance**.
  - **Main Table**: A dual-column custom HTML table:
    - **Receipts Column (Left)**: Lists the opening balances (cash, bank, advances) followed by all ledger categories for receipts (derived from Credit Vouchers/CV), showing subtotals and a grand total (Opening + Receipts).
    - **Payments Column (Right)**: Lists all ledger categories for payments (derived from Debit Vouchers/DV) showing subtotals, followed by closing balances (cash, bank, advances), ending with a grand total (Closing + Payments).
  - **Toolbar**: Contains `DateRangePicker`, a toggle radio button for the **Report Basis** (Accrual Basis vs. Cash Basis), and Export buttons (**PDF**, **EXCEL**).

### 12.3 Frontend API Integration
- **React Hook**: `useReceiptPaymentReport` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts).
- **API Call Function**: `getReceiptPaymentReport` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/receipt-payment`).
- **Parameters**: 
  - `fromDate`
  - `toDate`
  - `reportType` ('Accrual Basis' | 'Cash Basis')
- **Export Endpoints**:
  - `POST` `/account/report/receipt-payment-export`
  - **Payload**: `{ report_type: 'pdf' | 'excel', fromDate, toDate, reportType }` (returns binary blob)

### 12.4 Backend Logic & Database Queries
- **Controller Method**: `ReportApiController::receiptPaymentApi(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L693)
- **API Logic**:
  1. Retrieves predefined codes (`cash_code`, `bank_code`, `advance`) from `acc_predefine_accounts`.
  2. Resolves opening balances (`getOpenningSummery`) and closing balances (`getClossingSummery`) for each category:
     - Fetches active transaction heads (Level 4) under the parent head.
     - Calls opening balance helper (`AccCoa::getOpeningBalance`) and closing balance helper (`getClosingBalance`).
  3. Queries receipt items (`getItemLedgerReceiptPayment` with type `CV` / Credit Voucher) and payment items (`getItemLedgerReceiptPayment` with type `DV` / Debit Voucher):
     - Resolves transaction ledger codes with movements inside the date range.
     - Queries transaction summaries using `AccCoa::getGeneralLedgerReport` and sums up the credits (for CV) or debits (for DV).
  4. Returns the lists, opening/closing amounts, company details, and settings.
  5. Exports PDF/Excel reports via `ReportExportController::receipt_payment_export`.

### 12.5 Verification & Status
- **Frontend Code**: Clean split-screen layout. Handles rounding and sums subtotals reactively. Verifies mathematical balance (Receipts Grand Total matches Payments Grand Total).
- **Backend Code**: Computes opening and closing balances correctly using cache and ledger details.
- **Status**: **OK / Fully Functional**

---

## 13. Bank Reconciliation Report

### 13.1 Report Details
- **Component File**: [BankReconciliationReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/BankReconciliationReportPage.tsx)
- **Status**: **OK / Verified**

### 13.2 Purpose & Visual Layout
- **Purpose**: Reconciles the bank statements with ledger transaction entries by displaying a list of cheques issued. It groups transactions into **Approved Cheques (Honoured)** and **Unapproved Cheques (Pending)**.
- **Layout**:
  - **KPI Cards**: Four cards displaying **Honoured Amount**, **Honoured Cheques Qty**, **Pending Amount**, and **Pending Cheques Qty**.
  - **Tables**: Two separate tables rendered:
    - **Approved Cheques Table**: Lists cleared cheques with Sl, Voucher No, Particulars, Cheque No, Date, and Amount, ending with a total row.
    - **Unapproved Cheques Table**: Lists pending cheques in the same format.
  - **Toolbar**: 
    - `Select2` dropdown for selecting the **Bank Account** (defaults to the first bank nature account).
    - `DateRangePicker` for range filtering.
    - Export buttons for **PDF** and **EXCEL**.

### 13.3 Frontend API Integration
- **React Hook**: `useBankReconciliationReport` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts)
- **API Call Function**: `getBankReconciliationReport` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (HTTP Method: `GET`, Endpoint: `/account/report/bank-reconciliation`).
- **Parameters**: 
  - `fromDate`
  - `toDate`
  - `bankCode` (Bank head code)
- **Export Endpoints**:
  - `POST` `/account/report/bank-reconciliation-export`
  - **Payload**: `{ report_type: 'pdf' | 'excel', fromDate, toDate, bankCode }` (returns binary blob)

### 13.4 Backend Logic & Database Queries
- **Controller Methods**:
  - `ReportApiController::bankReconciliationApi(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L892)
  - `ReportApiController::reconciliationVoucher($dtpFromDate, $dtpToDate, $bankCode = null, $status = 0)`
- **API Logic**:
  1. Selects all active bank accounts from `acc_coas` where `is_bank_nature = 1`.
  2. Resolves default dates and selects the target bank code.
  3. Queries `acc_vauchers` (aliased `v`) joined with `acc_voucher_items` (aliased `vi`) and `acc_coas` (aliased `a`):
     - **Voucher Type**: Limited to `DV` (Debit Voucher / Cheque Payment Vouchers).
     - **Approval Filter**: `v.is_approved = 1`.
     - **Cheque Filter**: `v.cheque_no` is not null.
     - **Bank Nature**: `a.is_bank_nature = 1`.
     - **Credit Amount**: `vi.credit > 0` (selects voucher legs that credit/deduct the bank balance).
     - **Date Range**: `v.v_date` between `fromDate` and `toDate`.
     - **Bank Account Filter**: `vi.coa_id = bankCode`.
     - **Counter-party Ledger Sub-query**: Selects `head_name` from the opposite leg of the voucher where `coa_id != vi.coa_id` and saves it as `accountName`.
  4. Returns the collection of vouchers. The frontend separates them into Honoured (`is_honour = 1`) and Pending (`is_honour = 0`) arrays.
  5. Implements Excel and PDF exports via `ReportExportController::bank_reconciliation_export` using Maatwebsite Excel / Snappy PDF and identical database queries.

### 13.5 Verification & Status
- **Frontend Code**: Structurally clean and matches UI guidelines. Renders two lists with corresponding summaries and KPI cards. Uses `ListPageLayout` correctly.
- **Backend Code**: Correctly filters Debit Vouchers with a credit leg to bank accounts and resolves opposing account names dynamically.
- **Status**: **OK / Fully Functional**

---

## 14. Chart of Accounts (COA) Print Report

### 14.1 Report Details
- **Component File**: [CoaPrintReportPage.tsx](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/views/reports/CoaPrintReportPage.tsx)
- **Status**: **OK / Verified**

### 14.2 Purpose & Visual Layout
- **Purpose**: Displays the complete hierarchical structure of the General Ledger Chart of Accounts (COA).
- **Layout**:
  - **Main Table**: An indentation tree table.
    - Uses empty columns at the beginning representing the depth / level of the account (levels 1 through 4), with the active account code printed.
    - The account name spans the remaining columns (`colSpan`) and features different text styling depending on the hierarchy level (Level 1: bold uppercase primary color; Level 2: slate bold; Level 3/4: indented font weights).
  - **Toolbar**: Contains export buttons for **PDF** and **EXCEL** (rendered with professional gray icons).

### 14.3 Frontend API Integration
- **React Hook**: `useCoaPrintReport` in [useReports.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/hooks/useReports.ts)
- **API Call Function**: `getCoaPrintReport` in [reports.api.ts](file:///D:/laragon/www/erp_new/erp_frontend/src/modules/account/api/reports.api.ts) (`GET` `/account/report/coa-print`).
- **Parameters**: None
- **Export Endpoints**:
  - `POST` `/account/report/coa-print-export`
  - **Payload**: `{ report_type: 'pdf' | 'excel' }` (returns binary blob)

### 14.4 Backend Logic & Database Queries
- **Controller Method**: `ReportApiController::coaPrintApi(Request $request)` inside [ReportApiController.php](file:///D:/laragon/www/erp_new/erp_new/Applets/account/src/Http/Controllers/Api/Report/ReportApiController.php#L964)
- **API Logic**:
  1. Queries the `acc_coas` table:
     - **Filter**: `is_active = 1`.
     - **Ordering**: Sorted by `head_code` alphabetically.
  2. Queries the maximum account level using `AccCoa::where('is_active', 1)->max('head_level')` (defaults to 4).
  3. Returns `acc_coas` collection, `maxLevel`, company information, and web settings.
  4. Exports PDF and Excel versions using Maatwebsite Excel or Snappy PDF (`ReportExportController::coa_print_export`).

### 14.5 Verification & Status
- **Frontend Code**: Correctly renders the tree grid with dynamic indentation columns and custom text sizing/colors based on `HL`. Uses `ListPageLayout` as the base wrapper.
- **Backend Code**: Basic select query is clean and indexes properly.
- **Status**: **OK / Fully Functional**
