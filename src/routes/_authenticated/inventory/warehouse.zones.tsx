import { createFileRoute } from '@tanstack/react-router'
import { WarehouseZoneListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/warehouse/zones')({
  component: WarehouseZoneListPage,
})
