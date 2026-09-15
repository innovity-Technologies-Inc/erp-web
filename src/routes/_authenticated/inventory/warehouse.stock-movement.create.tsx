import { createFileRoute } from '@tanstack/react-router'
import { WarehouseTransferCreatePage } from '@/modules/inventory'

export const Route = createFileRoute(
  '/_authenticated/inventory/warehouse/stock-movement/create',
)({
  component: WarehouseTransferCreatePage,
})
