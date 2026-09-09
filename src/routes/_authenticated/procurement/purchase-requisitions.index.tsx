import { createFileRoute } from '@tanstack/react-router'
import { PurchaseRequisitionListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/purchase-requisitions/')({
  component: PurchaseRequisitionListPage,
})
