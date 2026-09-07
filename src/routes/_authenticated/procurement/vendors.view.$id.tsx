import { createFileRoute } from '@tanstack/react-router'
import { VendorViewPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/vendors/view/$id')({
  component: VendorViewPage,
})
