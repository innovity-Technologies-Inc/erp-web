import { createFileRoute } from '@tanstack/react-router'
import { WarehouseTransferViewPage } from '@/modules/inventory'

export const Route = createFileRoute(
  '/_authenticated/inventory/warehouse/stock-movement/view/$id',
)({
  component: WarehouseTransferViewPage,
})
