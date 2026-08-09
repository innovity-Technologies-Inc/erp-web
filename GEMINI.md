# Antigravity UI & Layout Rules

To maintain industry-standard consistency and prevent layout differences across the ERP:

## 1. Strict Layout Wrapper Usage
* **List Pages**: Always wrap list views in `<ListPageLayout>`.
* **Standard Props**: Pass parameters like `rowData`, `columnDefs`, `recordsTotal`, `currentPage`, `pageSize`, `totalPages`, `onPageChange`, and `onColumnToggle` directly to the `<ListPageLayout>` component.
* **No Custom Grids**: Avoid creating custom paginations, custom loaders, or manual table markups inside list pages. Let the core wrapper manage rendering to ensure identical design across all pages.

## 2. Toolbar & Filter Row Alignment
* **Single Horizontal Line**: Ensure all filter elements, buttons, and search forms reside on a single horizontal row inside the toolbar:
  * **Left Side**: Global Search (`searchValue`), Status Filter (`statusValue`), and custom category selectors (passed inside `toolbarExtra`).
  * **Right Side**: Date Range Pickers (`fromDate`/`toDate`) and Action buttons (e.g. Export, Create).
* **Grid Spacing**: Do not insert vertical line breaks or secondary filter panels beneath the main toolbar unless explicitly requested by the user.
