import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/useAuthStore'

export const Route = createFileRoute('/_authenticated/procurement/sourcing')({
  beforeLoad: () => {
    const { user, permissions } = useAuthStore.getState()
    const isSuperAdmin = Boolean(
      user?.roles?.some((r: any) => {
        const name = (typeof r === 'string' ? r : r?.name || '').toLowerCase()
        return name === 'super-admin' || name === 'super admin'
      }) || user?.user_type === 'super-admin'
    )

    const target =
      !isSuperAdmin &&
      !permissions.includes('view_purchase_requisition') &&
      (permissions.includes('view_rfq') || user?.user_type === 'vendor')
        ? '/procurement/rfqs'
        : '/procurement/purchase-requisitions'

    throw redirect({
      to: target,
    })
  },
})
