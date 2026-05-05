import { Bell, Settings, FileText, User as UserIcon, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { useState } from 'react'

export const Topbar = () => {
  const user = useAuthStore((state) => state.user)
  const clearUser = useAuthStore((state) => state.clearUser)
  const { sidebarOpen, toggleSidebar, notify } = useUiStore()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    clearUser()
    notify('Logout successful!', 'success')
  }

  return (
    <header className="h-20 flex items-center justify-between px-8 shrink-0 relative">
      <div className="flex items-center gap-6 flex-1">
        {/* Toggle Sidebar Button integrated into Topbar area */}
        <button 
          onClick={toggleSidebar}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary transition-colors hover:shadow-md"
        >
          {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        <h2 className="text-2xl font-bold text-gray-800 hidden lg:block">Dashboard</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Action Icons */}
        <div className="flex items-center gap-3 ml-4">
          <button className="w-10 h-10 flex items-center justify-center text-gray-400 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors border border-gray-50">
            <FileText className="h-5 w-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-gray-400 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors border border-gray-50">
            <Settings className="h-5 w-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-gray-400 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors border border-gray-50 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* User Profile */}
        <div className="relative ml-2">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 pl-4 pr-1.5 py-1.5 bg-white rounded-2xl shadow-sm border border-gray-50 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-bold text-gray-400">Admin</span>
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200">
               <UserIcon className="h-5 w-5" />
            </div>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-50 py-3 z-50 animate-in fade-in zoom-in duration-200">
                <div className="px-5 py-2 border-b border-gray-50 mb-2 text-center">
                  <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em]">Super Admin</p>
                  <p className="text-sm font-extrabold text-gray-700">{user?.name || 'Kazi Sakib'}</p>
                </div>
                <button className="w-full flex items-center gap-4 px-5 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors font-bold">
                  <UserIcon className="h-4 w-4" />
                  My Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors mt-2 border-t border-gray-50 font-black"
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
