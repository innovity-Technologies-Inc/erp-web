import { createFileRoute } from '@tanstack/react-router'
import { VendorEditPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/vendors/edit/$id')({
  component: VendorEditPage,
})
