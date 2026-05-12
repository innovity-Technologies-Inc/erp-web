import { Bell, Settings, User as UserIcon, LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { useState } from 'react'
import { useMatches } from '@tanstack/react-router'
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
  // Extract a readable title from the route path or metadata
  const pageTitle = (lastMatch?.staticData as any)?.title || 
                    lastMatch?.pathname.split('/').filter(Boolean).pop() || 
                    'Dashboard'

  const handleLogout = () => {
    clearUser()
    notify('Logout successful!', 'success')
  }

  const userFullName = user ? `${user.first_name} ${user.last_name}` : 'Kazi Sakib'

  return (
    <header className="h-16 flex items-center bg-white shrink-0 relative z-30 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border-b border-gray-100 px-0">
      {/* Logo Area - matches Sidebar width */}
      <div className={clsx(
        "flex items-center justify-between px-6 transition-all duration-300 shrink-0",
        sidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
           {logo ? (
             <img src={logo} alt={siteName} className="w-full h-full object-contain" />
           ) : (
             <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4L34 11.5V28.5L20 36L6 28.5V11.5L20 4Z" stroke="currentColor" className="text-primary" strokeWidth="3" strokeLinejoin="round"/>
                <path d="M10 15L20 10L30 15V25L20 30L10 25V15Z" fill="currentColor" className="text-primary" fillOpacity="0.1"/>
                <path d="M20 12V28M12 20H28" stroke="currentColor" className="text-primary" strokeWidth="3" strokeLinecap="round"/>
             </svg>
           )}
        </div>

        {sidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Toggle Button for collapsed state */}
      {!sidebarOpen && (
        <button 
          onClick={toggleSidebar}
          className="p-2 ml-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Vertical Separator */}
      <div className="h-8 w-[1.5px] bg-gray-100 mx-2"></div>

      {/* Page Title */}
      <div className="flex-1 flex items-center px-4">
        <h2 className="text-[18px] font-bold text-primary font-poppins">{pageTitle}</h2>
      </div>

      {/* Right Side Components */}
      <div className="flex items-center gap-4 px-6">
        {/* Action Icons */}
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
          <Settings className="h-5 w-5" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile - Pill Shape */}
        <div className="relative ml-2">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 px-4 py-1 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all group shadow-sm"
          >
            <span className="text-xs font-semibold text-gray-600 font-poppins">{userFullName}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 border border-gray-50 shadow-inner">
               {user?.image ? (
                 <img 
                   src={`${import.meta.env.VITE_STORAGE_URL}/${user.image}`} 
                   alt={userFullName} 
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <UserIcon className="h-4 w-4 text-gray-400" />
               )}
            </div>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in duration-200">
                <div className="px-5 py-2 border-b border-gray-50 mb-2">
                  <p className="text-xs font-bold text-gray-800">{userFullName}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
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
