import { createFileRoute } from '@tanstack/react-router'
import { VendorReturnListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/return/vendor/')({
  component: VendorReturnListPage,
})
