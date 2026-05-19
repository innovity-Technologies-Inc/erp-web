import { createFileRoute } from '@tanstack/react-router'
import { StockMovementCreatePage } from '@/modules/inventory'

export const Route = createFileRoute(
  '/_authenticated/inventory/warehouse/stock-movement/create',
)({
  component: StockMovementCreatePage,
})
