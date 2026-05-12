import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useSettings } from '@/hooks/useSettings'

export const AppShell = () => {
  // Initialize settings and inject theme colors
  useSettings()

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-main-bg">
      <Topbar />
      <div className="flex flex-1 overflow-hidden mt-1.5">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
