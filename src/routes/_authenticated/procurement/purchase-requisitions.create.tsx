import { createFileRoute } from '@tanstack/react-router'
import { PurchaseRequisitionCreatePage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/purchase-requisitions/create')({
  component: PurchaseRequisitionCreatePage,
})
