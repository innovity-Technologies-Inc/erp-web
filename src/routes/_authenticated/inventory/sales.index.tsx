import { createFileRoute } from '@tanstack/react-router'
import { SalesListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/sales/')({
  component: SalesListPage,
})
