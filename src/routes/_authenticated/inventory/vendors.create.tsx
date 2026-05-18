import { createFileRoute } from '@tanstack/react-router'
import { VendorCreatePage } from '@/modules/inventory/views/VendorCreatePage'

export const Route = createFileRoute('/_authenticated/inventory/vendors/create')({
  component: VendorCreatePage,
})
