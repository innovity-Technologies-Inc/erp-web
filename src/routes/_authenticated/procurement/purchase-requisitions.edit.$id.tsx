import { createFileRoute } from '@tanstack/react-router'
import { PurchaseRequisitionEditPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/purchase-requisitions/edit/$id')({
  component: PurchaseRequisitionEditPage,
})
