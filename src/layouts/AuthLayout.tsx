import { Outlet } from '@tanstack/react-router'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
        <div className="text-xl font-bold text-gray-800">Nexus ERP</div>
        <div className="text-sm text-gray-600 hover:underline cursor-pointer">Support</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 bg-[url('/auth-bg.svg')] bg-cover bg-center">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 bg-white border-t flex items-center justify-between px-8 text-xs text-gray-500 shrink-0">
        <div>© 2024 Nexus ERP Systems. All rights reserved.</div>
        <div className="flex gap-4">
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
          <span className="hover:underline cursor-pointer">Terms of Service</span>
          <span className="hover:underline cursor-pointer">Security</span>
          <span className="hover:underline cursor-pointer">Help Desk</span>
        </div>
      </footer>
    </div>
  )
}
