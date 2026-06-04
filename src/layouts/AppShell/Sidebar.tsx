import { useState } from 'react'
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
        activePaths: ['/inventory/sales']
      },
      { 
        name: 'Vendor', 
        icon: User, 
        to: '/inventory/vendors', 
        permission: 'view_supplier',
        activePaths: ['/inventory/vendors']
      },
      { 
        name: 'Product', 
        icon: Package, 
        to: '/inventory/product', 
        permission: 'view_product',
        activePaths: ['/inventory/product']
      },
      { 
        name: 'Warehouse', 
        icon: Warehouse, 
        to: '/inventory/warehouse', 
        permission: 'view_warehouse',
        activePaths: ['/inventory/warehouse']
      },
      { 
        name: 'Purchase', 
        icon: ShoppingCart, 
        to: '/inventory/purchase', 
        permission: 'view_purchase',
        activePaths: ['/inventory/purchase']
      },
      { 
        name: 'Merchant', 
        icon: Users, 
        to: '/inventory/merchant', 
        permission: 'view_merchant',
        activePaths: ['/inventory/merchant']
      },
      { 
        name: 'Return', 
        icon: RotateCcw, 
        to: '/inventory/return/vendor', 
        permission: 'sales_return',
        activePaths: ['/inventory/return']
      },
      { 
        name: 'Service', 
        icon: Wrench, 
        to: '/inventory/service', 
        permission: 'view_service',
        activePaths: ['/inventory/service']
      },
      { 
        name: 'Quotation', 
        icon: FileText, 
        to: '/inventory/quotation', 
        permission: 'view_quotation',
        activePaths: ['/inventory/quotation']
      },
    ]
  }
]

export const Sidebar = () => {
  const { sidebarOpen } = useUiStore()
  const { hasPermission } = usePermissions()
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState<{ name: string, top: number, left: number } | null>(null)

  const filteredMenuItems = menuItems.map(group => ({
    ...group,
    items: group.items.filter(item => !item.permission || hasPermission(item.permission))
  })).filter(group => group.items.length > 0)

  return (
    <aside 
      className={clsx(
        "bg-sidebar text-white transition-all duration-300 flex flex-col relative shrink-0 rounded-tr-2xl print:hidden",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Navigation */}
      <nav className={clsx(
        "flex-1 py-4 custom-scrollbar px-3 overflow-y-auto overflow-x-hidden",
        !sidebarOpen && "scrollbar-none" // Hide scrollbar visually when collapsed
      )}>
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
                      "flex items-center px-4 py-3 transition-all duration-200 group relative font-medium text-[14px] font-poppins",
                      isActive 
                        ? "bg-[#3b82f6] text-white shadow-lg rounded-xl pointer-events-none" // Disable hover on active
                        : "text-white hover:bg-[#3b82f6] hover:text-white rounded-xl",
                      !sidebarOpen && [
                        "justify-center px-0 h-12 w-12 mx-auto mb-1",
                        !isActive && "hover:rounded-r-none z-[100]"
                      ]
                    )}
                    onMouseEnter={(e) => {
                      if (!sidebarOpen && !isActive) {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setHoveredItem({ name: item.name, top: rect.top, left: rect.right })
                      }
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <item.icon className={clsx("w-5 h-5 shrink-0", sidebarOpen ? "mr-3" : "mr-0")} strokeWidth={2.5} />
                    {sidebarOpen && <span>{item.name}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Flyout Label for Collapsed Sidebar */}
      {!sidebarOpen && hoveredItem && (
        <div 
          className="fixed bg-[#3b82f6] text-white text-[14px] rounded-r-xl z-[9999] flex items-center px-4 font-semibold shadow-xl pointer-events-none animate-in fade-in slide-in-from-left-1 duration-200"
          style={{ 
            top: hoveredItem.top, 
            left: hoveredItem.left,
            height: 48 // h-12 = 48px
          }}
        >
          {hoveredItem.name}
        </div>
      )}
    </aside>
  )
}
