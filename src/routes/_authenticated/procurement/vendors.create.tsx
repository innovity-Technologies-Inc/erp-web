import { createFileRoute } from '@tanstack/react-router'
import { VendorCreatePage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/vendors/create')({
  component: VendorCreatePage,
})
