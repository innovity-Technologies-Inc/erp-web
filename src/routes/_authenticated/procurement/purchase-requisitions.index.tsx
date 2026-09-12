import { createFileRoute, redirect } from '@tanstack/react-router'
import { PurchaseRequisitionListPage } from '@/modules/procurement'
import { useAuthStore } from '@/store/useAuthStore'

export const Route = createFileRoute('/_authenticated/procurement/purchase-requisitions/')({
  beforeLoad: () => {
    const { user, permissions } = useAuthStore.getState()
    const isSuperAdmin = Boolean(
      user?.roles?.some((r: any) => {
        const name = (typeof r === 'string' ? r : r?.name || '').toLowerCase()
        return name === 'super-admin' || name === 'super admin'
      }) || user?.user_type === 'super-admin'
    )

    if (
      !isSuperAdmin &&
      !permissions.includes('view_purchase_requisition') &&
      (permissions.includes('view_rfq') || user?.user_type === 'vendor')
    ) {
      throw redirect({
        to: '/procurement/rfqs',
      })
    }
  },
  component: PurchaseRequisitionListPage,
})
