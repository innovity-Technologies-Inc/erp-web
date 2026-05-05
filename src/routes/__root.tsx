import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ToastContainer } from '@/components/Notification/ToastContainer'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ToastContainer />
      <TanStackRouterDevtools />
    </>
  ),
})
