import { Link, useLocation } from '@tanstack/react-router'
import { 
  LayoutDashboard, 
  Scale, 
  User, 
  Package, 
  Warehouse, 
  ShoppingCart, 
  Users, 
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
      { 
        name: 'Sale', 
        icon: Scale, 
        to: '/inventory/sales', 
        permission: 'view_sales',
        // Define paths that should also trigger this item as active
        activePaths: ['/inventory/sales', '/inventory/terms', '/inventory/contact-us']
      },
      { name: 'Vendor', icon: User, to: '/inventory/vendor', permission: 'view_supplier' },
      { name: 'Product', icon: Package, to: '/inventory/product', permission: 'view_product' },
      { name: 'Warehouse', icon: Warehouse, to: '/inventory/warehouse', permission: 'view_warehouse' },
      { name: 'Purchase', icon: ShoppingCart, to: '/inventory/purchase', permission: 'view_purchase' },
      { name: 'Merchant', icon: Users, to: '/inventory/merchant', permission: 'view_merchant' },
      { name: 'Return', icon: RotateCcw, to: '/inventory/return', permission: 'sales_return' },
      { name: 'Service', icon: Wrench, to: '/inventory/service', permission: 'view_service' },
      { name: 'Quotation', icon: FileText, to: '/inventory/quotation', permission: 'view_quotation' },
    ]
  }
]

export const Sidebar = () => {
  const { sidebarOpen } = useUiStore()
  const { hasPermission } = usePermissions()
  const location = useLocation()

  const filteredMenuItems = menuItems.map(group => ({
    ...group,
    items: group.items.filter(item => !item.permission || hasPermission(item.permission))
  })).filter(group => group.items.length > 0)

  return (
    <aside 
      className={clsx(
        "bg-sidebar text-white transition-all duration-300 flex flex-col relative shrink-0 rounded-tr-2xl",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar px-3">
        {filteredMenuItems.map((group, idx) => (
          <div key={idx} className="mb-6">
            {sidebarOpen && (
              <h3 className="px-4 text-[11px] font-medium text-white/40 mb-3 tracking-[0.1em] uppercase font-poppins">
                {group.group}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = item.activePaths 
                  ? item.activePaths.some(path => location.pathname.startsWith(path))
                  : location.pathname === item.to

                return (
                  <Link
                    key={item.name}
                    to={item.to as any}
                    className={clsx(
                      "flex items-center px-4 py-3 transition-all duration-200 group relative rounded-xl font-medium text-[14px] font-poppins hover:bg-white hover:text-primary",
                      isActive ? "bg-white text-primary shadow-xl" : "text-white",
                      !sidebarOpen && "justify-center px-0"
                    )}
                  >
                    <item.icon className={clsx("w-5 h-5 shrink-0", sidebarOpen ? "mr-3" : "mr-0")} strokeWidth={2} />
                    {sidebarOpen && <span>{item.name}</span>}
                    
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                        {item.name}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
