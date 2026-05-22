import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useSettings } from '@/hooks/useSettings'

export const AppShell = () => {
  // Initialize settings and inject theme colors
  useSettings()

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-main-bg print:h-auto print:overflow-visible print:bg-white">
      <Topbar />
      <div className="flex flex-1 overflow-hidden mt-5 print:block print:mt-0 print:overflow-visible">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-2 custom-scrollbar print:overflow-visible print:px-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
