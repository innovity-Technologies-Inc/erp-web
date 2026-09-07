import { createFileRoute } from '@tanstack/react-router'
import { VendorListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/vendors/')({
  component: VendorListPage,
})
