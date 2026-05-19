import { createFileRoute } from '@tanstack/react-router'
import { VendorListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/vendors/')({
  component: VendorListPage,
})
