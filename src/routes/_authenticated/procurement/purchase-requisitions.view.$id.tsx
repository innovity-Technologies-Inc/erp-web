import { createFileRoute } from '@tanstack/react-router'
import { PurchaseRequisitionViewPage } from '@/modules/procurement'

export const Route = createFileRoute(
  '/_authenticated/procurement/purchase-requisitions/view/$id',
)({
  component: PurchaseRequisitionViewPage,
})
