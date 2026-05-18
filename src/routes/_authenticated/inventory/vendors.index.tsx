import { createFileRoute } from '@tanstack/react-router'
import { VendorListPage } from '@/modules/inventory/views/VendorListPage'

export const Route = createFileRoute('/_authenticated/inventory/vendors/')({
  component: VendorListPage,
})
