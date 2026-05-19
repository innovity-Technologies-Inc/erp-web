import { createFileRoute } from '@tanstack/react-router'
import { VendorEditPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/vendors/edit/$id')({
  component: VendorEditPage,
})
