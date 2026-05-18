import { createFileRoute } from '@tanstack/react-router'
import { VendorEditPage } from '@/modules/inventory/views/VendorEditPage'

export const Route = createFileRoute('/_authenticated/inventory/vendors/edit/$id')({
  component: VendorEditPage,
})
