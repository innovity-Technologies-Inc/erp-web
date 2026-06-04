import { createFileRoute } from '@tanstack/react-router'
import { WastageListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/return/wastage/')({
  component: WastageListPage,
})
