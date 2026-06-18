export const salesReportOptions = [
  { name: 'Todays Sales Report', to: '/inventory/report/sales' as any },
  { name: 'Merchant Wise Sales Report', to: '/inventory/report/merchant-wise-sales' as any },
  { name: 'User Wise Sales Report', to: '/inventory/report/user-wise-sales' as any },
  { name: 'Product Wise Sales Report', to: '/inventory/report/product-wise-sales' as any },
  { name: 'Category Wise Sales Report', to: '/inventory/report/category-wise-sales' as any },
  { name: 'Invoice Wise Due Report', to: '/inventory/report/due' as any },
  { name: 'Shipping Cost Report', to: '/inventory/report/shipping-cost' as any },
  { name: 'Sale Wise Profit Report', to: '/inventory/report/sale-wise-profit' as any },
]

export const cashReportOptions = [
  { name: 'Closing account', to: '/inventory/report/cash-closing' as any },
  { name: 'Cash Closing Report', to: '/inventory/report/cash-closing-report' as any },
]

export const stockReportOptions = [
  { name: 'Stock Report', to: '/inventory/report/stock' as any },
  { name: 'Stock Movement Report', to: '/inventory/report/stock-movement' as any },
  { name: 'Warehouse Wise Stock Report', to: '/inventory/report/warehouse-wise-stock' as any },
]

export const purchaseReportOptions = [
  { name: 'Todays Purchase Report', to: '/inventory/report/todays-purchase' as any },
  { name: 'Vendor Wise Purchase Report', to: '/inventory/report/vendor-wise-purchase' as any },
  { name: 'Category Wise Purchase Report', to: '/inventory/report/category-wise-purchase' as any },
]

export const merchantReportOptions = [
  { name: 'Todays Merchant Receipt', to: '/inventory/report/todays-merchant-receipt' as any },
]

export const returnReportOptions = [
  { name: 'Sales Return Report', to: '/inventory/report/sales-return' as any },
  { name: 'Vendor Return Report', to: '/inventory/report/vendor-return' as any },
]

export const reportCategoryTabs = [
  { name: 'Sales', to: '/inventory/report/sales', active: true },
  { name: 'Cash', to: '/inventory/report/cash-closing', active: false },
  { name: 'Stock', to: '/inventory/report/stock', active: false },
  { name: 'Purchase', to: '/inventory/report/todays-purchase', active: false },
  { name: 'Merchant', to: '/inventory/report/todays-merchant-receipt', active: false },
  { name: 'Return', to: '/inventory/report/sales-return', active: false },
]
