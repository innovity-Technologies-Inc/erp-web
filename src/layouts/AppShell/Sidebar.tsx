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
  FileText,
  BookOpen,
  UserCog,
  Settings
} from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'

interface MenuItem {
  name: string
  icon: any
  to: string
  permission?: string
  activePaths?: string[]
}

interface MenuGroup {
  group: string
  items: MenuItem[]
}

const menuItems: MenuGroup[] = [
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
  },
  {
    group: 'REPORT',
    items: [
      { 
        name: 'Sales Report', 
        icon: FileText, 
        to: '/inventory/report/sales', 
        permission: 'todays_sales_report', // From Laravel route permission
        activePaths: [
          '/inventory/report/sales', 
          '/inventory/report/merchant-wise-sales',
          '/inventory/report/user-wise-sales',
          '/inventory/report/product-wise-sales',
          '/inventory/report/category-wise-sales',
          '/inventory/report/due',
          '/inventory/report/shipping-cost',
          '/inventory/report/sale-wise-profit',
          '/inventory/report/cash-closing',
          '/inventory/report/cash-closing-report',
          '/inventory/report/stock',
          '/inventory/report/stock-movement',
          '/inventory/report/warehouse-wise-stock',
          '/inventory/report/todays-purchase',
          '/inventory/report/vendor-wise-purchase',
          '/inventory/report/category-wise-purchase'
        ]
      },
    ]
  },
  {
    group: 'ACCOUNT',
    items: [
      { 
        name: 'Account', 
        icon: BookOpen, 
        to: '/account/chart-of-accounts', 
        permission: 'chart_of_account',
        activePaths: ['/account']
      },
    ]
  },
  {
    group: 'HRM',
    items: [
      { 
        name: 'HRM', 
        icon: Users, 
        to: '/hrm/designation', 
        permission: 'view_designation',
        activePaths: ['/hrm']
      },
    ]
  },
  {
    group: 'USER CONFIG',
    items: [
      { 
        name: 'User Management', 
        icon: UserCog, 
        to: '/user', 
        permission: 'view_user',
        activePaths: ['/user', '/role']
      },
      { 
        name: 'Settings', 
        icon: Settings, 
        to: '/settings/organization', 
        permission: ['view_company', 'view_currency', 'view_print_setting', 'view_email_setting', 'view_general_setting'],
        activePaths: ['/settings']
      },
    ]
  }
]

export const Sidebar = () => {
  const { sidebarOpen } = useUiStore()
  const { hasPermission, hasAnyPermission } = usePermissions()
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState<{ name: string, top: number, left: number } | null>(null)

  const filteredMenuItems = menuItems.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.permission) return true
      if (Array.isArray(item.permission)) {
        return hasAnyPermission(item.permission)
      }
      return hasPermission(item.permission)
    })
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
            {sidebarOpen ? (
              <h3 className="px-4 text-[11px] font-medium text-white/40 mb-3 tracking-[0.1em] uppercase font-poppins">
                {group.group}
              </h3>
            ) : (
              <div className="flex justify-center mb-4 mt-2">
                <span className="text-white/30 text-[24px] font-bold leading-[0] tracking-[0.15em] block h-[10px]">...</span>
              </div>
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
                    onClick={() => setHoveredItem(null)}
                    className={clsx(
                      "flex items-center px-4 py-3 group relative font-medium text-[14px] font-poppins cursor-pointer",
                      isActive 
                        ? "bg-[#3b82f6] text-white shadow-lg rounded-xl"
                        : "text-white rounded-xl",
                      // When open, use normal smooth CSS hover
                      sidebarOpen && !isActive && "hover:bg-[#3b82f6] transition-all duration-200",
                      // When closed, rely strictly on React state for hover styling to perfectly sync with flyout rendering
                      !sidebarOpen && [
                        "justify-center px-0 h-12 w-12 mx-auto mb-1",
                        !isActive && hoveredItem?.name === item.name 
                          ? "bg-[#3b82f6] rounded-r-none z-[100]" 
                          : "transition-all duration-200"
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
          className="fixed bg-[#3b82f6] text-white text-[14px] rounded-r-xl z-[9999] flex items-center px-4 font-semibold shadow-xl pointer-events-none animate-flyout-in"
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
