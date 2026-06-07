import { createFileRoute } from '@tanstack/react-router'
import { WastageDetailsPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/return/wastage/details/$id')({
  component: WastageDetailsPage,
})
