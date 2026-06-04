import { createFileRoute } from '@tanstack/react-router'
import { VendorReturnCreatePage } from '@/modules/inventory/views/return/VendorReturnCreatePage'

export const Route = createFileRoute('/_authenticated/inventory/return/vendor/create')({
  component: VendorReturnCreatePage,
})
