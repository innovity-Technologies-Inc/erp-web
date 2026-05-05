import { Link } from '@tanstack/react-router'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  Warehouse, 
  Truck, 
  Store, 
  RotateCcw, 
  Wrench, 
  FileText
} from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'

const menuItems = [
  {
    group: 'DASHBOARD',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, to: '/' },
    ]
  },
  {
    group: 'INVENTORY',
    items: [
      { name: 'Sale', icon: ShoppingCart, to: '/inventory/sale', permission: 'view_sales' },
      { name: 'Vendor', icon: Users, to: '/inventory/vendor', permission: 'view_supplier' },
      { name: 'Product', icon: Package, to: '/inventory/product', permission: 'view_product' },
      { name: 'Warehouse', icon: Warehouse, to: '/inventory/warehouse', permission: 'view_warehouse' },
      { name: 'Purchase', icon: Truck, to: '/inventory/purchase', permission: 'view_purchase' },
      { name: 'Merchant', icon: Store, to: '/inventory/merchant', permission: 'view_merchant' },
      { name: 'Return', icon: RotateCcw, to: '/inventory/return', permission: 'sales_return' },
      { name: 'Service', icon: Wrench, to: '/inventory/service', permission: 'view_service' },
      { name: 'Quotation', icon: FileText, to: '/inventory/quotation', permission: 'view_quotation' },
    ]
  }
]

export const Sidebar = () => {
  const { sidebarOpen } = useUiStore()
  const { hasPermission } = usePermissions()

  const filteredMenuItems = menuItems.map(group => ({
    ...group,
    items: group.items.filter(item => !item.permission || hasPermission(item.permission))
  })).filter(group => group.items.length > 0)

  return (
    <aside 
      className={clsx(
        "text-white transition-all duration-300 flex flex-col relative shrink-0",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 gap-3 shrink-0">
        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-lg shrink-0">
          <span className="text-primary font-black text-2xl">G</span>
        </div>
        {sidebarOpen && (
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight leading-none">GEN-ITECH</span>
            <span className="text-[7px] font-bold opacity-60 uppercase tracking-[0.1em] mt-1">We build your dream</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar px-3 mt-4">
        {filteredMenuItems.map((group, idx) => (
          <div key={idx} className="mb-6">
            {sidebarOpen && (
              <h3 className="px-4 text-[10px] font-black text-white/40 mb-3 tracking-[0.2em] uppercase">
                {group.group}
              </h3>
            )}
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  to={item.to}
                  activeProps={{ 
                    className: 'bg-white text-primary shadow-xl rounded-xl' 
                  }}
                  className={clsx(
                    "flex items-center px-4 py-3 transition-all duration-200 hover:bg-white/10 hover:text-white group relative rounded-xl font-bold text-sm",
                    !sidebarOpen && "justify-center px-0"
                  )}
                >
                  <item.icon className={clsx("w-5 h-5 shrink-0", sidebarOpen ? "mr-3" : "mr-0")} strokeWidth={2.5} />
                  {sidebarOpen && <span>{item.name}</span>}
                  
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl border border-white/10">
                      {item.name}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
