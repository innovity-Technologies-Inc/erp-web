import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export const AppShell = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#004799]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 bg-[#004799]">
        <div className="flex flex-col flex-1 bg-white rounded-tl-[45px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar ">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
