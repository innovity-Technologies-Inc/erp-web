export const getWarehouseTabs = (activeTab: 'warehouse' | 'zones' | 'rack-bins' | 'stock-movement') => [
  { name: 'Manage Warehouse', to: '/inventory/warehouse', active: activeTab === 'warehouse', permission: 'view_warehouse' },
  { name: 'Warehouse Zones', to: '/inventory/warehouse/zones', active: activeTab === 'zones', permission: 'view_warehouse' },
  { name: 'Rack & Bins', to: '/inventory/warehouse/rack-bins', active: activeTab === 'rack-bins', permission: 'view_warehouse' },
  { name: 'Stock Movement', to: '/inventory/warehouse/stock-movement', active: activeTab === 'stock-movement', permission: 'warehouse_stock_movement' },
]

export const warehouseTitleOptions = [
  { name: 'Warehouse List', to: '/inventory/warehouse', permission: 'view_warehouse' },
  { name: 'Warehouse Zones', to: '/inventory/warehouse/zones', permission: 'view_warehouse' },
  { name: 'Rack & Bin Locations', to: '/inventory/warehouse/rack-bins', permission: 'view_warehouse' },
  { name: 'Stock Movement', to: '/inventory/warehouse/stock-movement', permission: 'warehouse_stock_movement' },
]
