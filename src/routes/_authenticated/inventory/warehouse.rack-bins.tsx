import { createFileRoute } from '@tanstack/react-router'
import { WarehouseRackBinListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/warehouse/rack-bins')({
  component: WarehouseRackBinListPage,
})
