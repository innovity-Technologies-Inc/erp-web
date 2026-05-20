import { createFileRoute } from '@tanstack/react-router'
import { UnitListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/product/unit')({
  component: UnitListPage,
})
