import { createFileRoute } from '@tanstack/react-router'
import { WarehouseCreatePage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/warehouse/create')({
  component: WarehouseCreatePage,
})
