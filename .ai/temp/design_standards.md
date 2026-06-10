# ERP Design Standards & Blueprint

This document defines the **STRICT** visual and structural standards for all new pages and components in the ERP React migration. Adhere to these exactly to maintain high-fidelity consistency.

---

## 1. Typography & Global Styles
- **Font Family**: **Poppins** (System-wide).
- **Body Text**: `text-[#475569]`, `font-medium`, `text-[13px]`.
- **Labels**: `text-[13px]`, `font-semibold`, `text-[#475569]`.
- **Card Titles**: `text-[16px]`, `font-bold`, `text-[#1e293b]`.
- **Page Titles**: `text-[20px]`, `font-medium`, `text-primary`.
- **Table Headers**: `text-[12px]`, `font-bold`, `uppercase`, `tracking-wider`.
- **Serial Numbers (SL)**: `text-gray-400`, `font-medium`.

---

## 2. Page Header Standards

### Type A: List/Management Pages (With Tabs)
- **Container**: `ListPageLayout` component.
- **Background**: White with subtle borders.
- **Navigation**:
    - **Back Button**: Branded box style (`bg-white border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium`).
    - **Tabs**: `px-2 py-2 text-[10px] font-medium rounded-lg`. Active: `bg-[#3b82f6] text-white shadow-lg`. Inactive: `bg-white text-gray-500 border-gray-50`.
- **Filters**:
    - **Search**: `w-full h-10 px-4 bg-gray-50/50 border-gray-200 rounded-lg`.
    - **Status/DateRange**: Integrated into `ListPageLayout` toolbar.

### Type B: Transaction Pages (Create, Edit, View - No Tabs)
- **Container**: `max-w-[1600px] mx-auto pb-6`.
- **Layout**:
    - **Left**: `ArrowLeft` icon + "Back" text in a box.
    - **Center/Left**: Page title (e.g., "New Stock Movement").
- **Spacing**: `pb-6` below the header before the form/content grid.

### Type C: Report Pages (Complex Headers & Footers)
- **Container**: `ListPageLayout` component.
- **Custom Header Navigation (`customHeaderRight`)**: Instead of standard tabs, use a mix of standalone links and the `TabDropdown` component (for grouped reports like Sales/Purchases). 
  - **TabDropdown**: Must use smooth `animate-slide-down`, match the trigger button width exactly, and include subtle separators (`border-b border-blue-50`) between items.
- **Custom Toolbar (`toolbarRightExtra`)**: 
  - DateRangePicker is centrally aligned.
  - Export buttons (PDF/Excel) must use grayscale icons (`text-[#64748b]`) in reports to maintain a clean, professional aesthetic, overriding the default colorful branding.
- **Summary Footers (Totals)**:
  - **MANDATORY PATTERN**: Always use the **Appended In-Grid Summary Row** pattern. This ensures totals align perfectly with headers and move automatically when columns are resized or scrolled.
  - **Implementation**:
    1.  Append a synthetic row to your data array (e.g., `gridData`) marked with `isSummary: true`.
    2.  Pass this `gridData` to the `rowData` prop of the table.
    3.  Update `columnDefs` to handle this row (e.g., return empty string for SL, "Total:" label for the name column) using type casting: `(params.data as any)?.isSummary`.
    4.  Apply custom styling (background, font-weight, top border) via `getRowStyle` in `gridOptions`.
  - **Note**: In this pattern, the summary row appears immediately after the last data row, which maintains perfect column-to-column integrity.
  - **Constraint**: NEVER use external Flexbox footers or the `summaryFooter` prop in `ListPageLayout` for table-aligned totals.

---

## 3. Structural Layout (Transactions)
- **Main Grid**: `grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch`.
- **Column Ratios**:
    - **Left Column (`lg:col-span-4` or `lg:col-span-7`)**: Primarily for main details or business info.
    - **Right Column (`lg:col-span-8` or `lg:col-span-5`)**: For supplementary details or line items.
- **Card Style**: `bg-white rounded-xl border border-primary/10 p-4 shadow-sm`.
- **Card Header**: Subtle `border-b border-gray-50 pb-4` with icon + title.

---

## 4. Input & Form Elements
- **Standard Input**: `w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium`.
- **Textarea**: Same as input but `p-4` and `resize-none`.
- **Dropdowns**: **ALWAYS** use `Select2` component. Native `<select>` is forbidden.
- **Error State**: `border-rose-500 focus:ring-rose-500/10`.
- **Required Star**: `<span className="text-rose-500">*</span>`.

---

## 5. Standardized Loading Indicators
- **Component**: ALWAYS use the global `LoadingState` component from `@/components/Loading/LoadingState`.
- **Icon**: Uses `Loader2` from `lucide-react` with `animate-spin` and `text-primary`.
- **Text**: Standard font `text-[14px] font-medium text-[#64748b]`.
- **Message**: Provide a context-specific message (e.g., "Loading merchant details...").
- **Constraint**: Custom spinners, localized loading logic, or different icons for full-page or section loading are strictly forbidden.

---

## 6. Button & Action System
- **Save / Primary**: 
    - **Class**: `px-16 h-12 bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2`.
    - **Text**: `Save` or `Update`.
- **Cancel / Secondary**:
    - **Class**: `px-12 h-12 bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[16px] shadow-sm`.
- **Add Row Button (Table)**: Branded dashed border container with `Plus` icon, centered.
- **Table Action Icons**:
    - **View**: Blue (`text-[#1e4ba1]`), `hover:bg-blue-50`.
    - **Edit**: Emerald (`text-[#10b981]`), `hover:bg-emerald-50`.
    - **Delete**: Rose (`text-[#ef4444]`), `hover:bg-rose-50`.
    - **Effect**: `rounded-xl transition-all border border-transparent hover:scale-110`.

- **Form Discard Protection (Dirty Check)**: 
    - **Standard**: ALL Create transaction forms MUST protect unsaved data. Edit pages are exempt.
    - **Implementation**: Use `isDirty` from `useForm`. If true when clicking "Cancel" or "Back", show `ConfirmationModal` (variant="danger").
    - **Modal Content**: Title: "Discard Changes?", Message: "You have unsaved changes. Are you sure you want to discard them?", Confirm Text: "Yes, Discard".

---

---

## 7. AG Grid & Filtering Standards (MANDATORY)

### 1. Column Visibility Control
- **Logic**: Use a `visibleCols` state object (Boolean mapping).
- **AG Grid Integration**: Bind the `hide` property of each `ColDef` to the negative of the visibility state (e.g., `hide: !visibleCols.name`).
- **Dependencies**: The `columnDefs` `useMemo` MUST depend on `visibleCols`.
- **Menu**: Populate the `columns` prop in `ListPageLayout` with an array of objects: `{ name: string, field: string, visible: boolean }`.
- **Vertical Alignment**: ALL cells (especially those with badges or icons) MUST use `flex items-center` to maintain visual integrity when columns are toggled.

### 2. Date Range Filtering
- **Backend Parameters**: Must use `start_date` and `end_date` as keys in the API request.
- **Frontend State**: Maintain `fromDate` and `toDate` local states.
- **Synchronization**: Pass both states and the `onDateRangeChange` handler to `ListPageLayout`.
- **Fallback**: The layout will automatically hide the `DateRangePicker` if no handler is provided.

## 6. Table Standards (AG Grid)
- **Cell Height**: `px-4 py-3`.
- **Header Style**: `bg-[#dae8ff] text-[12px] font-bold text-[#003671] uppercase tracking-wider`.
- **Row Hover**: `hover:bg-gray-50/50 transition-colors`.
- **Column Pinning**: `SL` pinned left, `ACTION` pinned right.
- **Status Badges**:
    - **Active/Success**: `bg-[#dcfce7] text-[#166534]`.
    - **Inactive/Danger**: `bg-[#fee2e2] text-[#991b1b]`.

---

## 8. Responsiveness & Adaptive Layout
All pages **MUST** be fully responsive and provide a seamless experience from mobile to ultra-wide desktops.

- **Mobile-First Grids**: 
    - Always use `grid-cols-1` as default and upgrade to `lg:grid-cols-12` for desktop.
    - Example: `className="grid grid-cols-1 lg:grid-cols-12 gap-6"`.
- **Adaptive Spacing**:
    - Use `p-4` or `p-6` for containers. On mobile, prefer `p-4` to maximize screen real estate.
    - Vertical spacing between cards should be `space-y-6` or managed via `gap-6` in the grid.
- **Table Responsiveness**:
    - AG Grid tables should have horizontal scrolling enabled by default.
    - Critical columns (SL, Name, Action) should be pinned or prioritized.
- **Header Adaptability**:
    - Navigation tabs must wrap or become scrollable on mobile devices.
    - Page titles may need `text-[18px]` on mobile if they are too long.
- **Component Visibility**:
    - Use `hidden lg:block` to hide non-essential decorations or secondary columns on smaller screens to reduce clutter.
- **Button Stacking**:
    - Action buttons (Save/Cancel) should remain in a `flex` row on tablet/desktop but may stack vertically using `flex-col` on small mobile screens if space is tight.
