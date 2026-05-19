import { createFileRoute } from '@tanstack/react-router'
import { WarehouseListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/warehouse/')({
  component: WarehouseListPage,
})
