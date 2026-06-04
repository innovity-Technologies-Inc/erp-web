import { createFileRoute } from '@tanstack/react-router'
import { VendorReturnDetailsPage } from '@/modules/inventory/views/return/VendorReturnDetailsPage'

export const Route = createFileRoute('/_authenticated/inventory/return/vendor/details/$id')({
  component: VendorReturnDetailsPage,
})
