import { Bell, Settings, User as UserIcon, LogOut, Expand, Shrink, Home, RotateCcw } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { useState } from 'react'
import { useMatches, Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { useSettings } from '@/hooks/useSettings'

export const Topbar = () => {
  const user = useAuthStore((state) => state.user)
  const clearUser = useAuthStore((state) => state.clearUser)
  const { sidebarOpen, toggleSidebar, notify } = useUiStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const { logo, siteName } = useSettings()
  
  const matches = useMatches()
  const lastMatch = matches[matches.length - 1]
  
  // Breadcrumb logic
  const pathParts = lastMatch?.pathname.split('/').filter(Boolean) || []
  
  const handleLogout = () => {
    clearUser()
    notify('Logout successful!', 'success')
  }

  const userFullName = user ? `${user.first_name} ${user.last_name}` : 'Kazi Sakib'

  return (
    <header className="h-16 flex items-center bg-white shrink-0 relative z-30 border-b border-gray-100 shadow-[0_2px_10px_rgba(30,75,161,0.5)] px-0">
      {/* Logo Area */}
      <div className={clsx(
        "flex items-center justify-between px-6 transition-all duration-300 shrink-0 border-r border-gray-100 h-full",
        sidebarOpen ? "w-64" : "w-20 px-0 justify-center"
      )}>
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
           {logo ? (
             <img src={logo} alt={siteName} className="w-full h-full object-contain" />
           ) : (
             <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4L34 11.5V28.5L20 36L6 28.5V11.5L20 4Z" stroke="var(--color-primary)" strokeWidth="3" strokeLinejoin="round"/>
                <path d="M10 15L20 10L30 15V25L20 30L10 25V15Z" fill="var(--color-primary)" fillOpacity="0.1"/>
                <path d="M20 12V28M12 20H28" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round"/>
             </svg>
           )}
        </div>
        

        {/* Logo Area er vitore Sidebar Open thakle */}
        {sidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
          >
            {/* Image er ulto icon (Minimize) */}
            <Shrink className="w-5 h-5" /> 
          </button>
        )}

        {/* Logo Area er baire Sidebar Close thakle (Image er moto icon) */}
        {!sidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="p-2 ml-4 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
          >
            {/* Precisely your shared image icon */}
            <Expand className="w-5 h-5" /> 
          </button>
        )}
      </div>

      {/* Navigation / Breadcrumbs */}
      <div className="flex-1 flex items-center px-6 gap-3">
        <Link to="/" className="text-gray-500 hover:text-primary transition-colors">
          <Home className="w-5 h-5" />
        </Link>
        
        <div className="flex items-center text-[14px] font-medium font-poppins text-[#94a3b8] gap-2.5">
           <span className="hover:text-primary cursor-pointer transition-colors">Dashboard</span>
           <span className="text-gray-300 font-light text-lg">/</span>
           
           {pathParts.includes('inventory') && (
             <>
               <span className="hover:text-primary cursor-pointer transition-colors">Sales</span>
               <span className="text-gray-300 font-light text-lg">/</span>
             </>
           )}

           <span className="text-[#003671] font-bold">
             {(() => {
               if (pathParts.includes('create')) return 'Add Sale'
               if (pathParts.includes('terms')) return 'Manage Sales Terms'
               if (pathParts.includes('payments')) return 'Manage Sales Payment'
               if (pathParts.includes('contact-us')) return 'Manage Contact Us'
               if (pathParts.includes('sales')) return 'Manage Sale'
               return 'Dashboard'
             })()}
           </span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4 px-6">
        {/* Reset Button */}
        <button className="flex items-center gap-2 px-5 py-2 bg-[#f1f5f9] text-[#7c8db5] rounded-full text-[14px] font-medium hover:bg-gray-200 transition-all mr-2">
          <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
          Reset
        </button>

        <button className="p-2 text-[#94a3b8] hover:text-primary transition-colors">
          <Settings className="h-5.5 w-5.5" />
        </button>
        
        <button className="p-2 text-[#94a3b8] hover:text-primary transition-colors relative">
          <Bell className="h-5.5 w-5.5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#7c3aed] rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <div className="relative ml-1">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pr-1 pl-4 py-1 border border-gray-200 rounded-full hover:border-primary/30 transition-all bg-white shadow-sm"
          >
            <span className="text-[14px] font-medium text-[#475569]">{userFullName}</span>
            <div className="w-8.5 h-8.5 rounded-full flex items-center justify-center overflow-hidden bg-[#e2e8f0]">
               {user?.image ? (
                 <img 
                   src={`${import.meta.env.VITE_STORAGE_URL}/${user.image}`} 
                   alt={userFullName} 
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <UserIcon className="h-5 w-5 text-white" />
               )}
            </div>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in duration-200">
                <div className="px-5 py-2 border-b border-gray-50 mb-2">
                  <p className="text-xs font-medium text-gray-800">{userFullName}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
