import { createFileRoute } from '@tanstack/react-router'
import { VendorBlacklistListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/vendors/blacklists')({
  component: VendorBlacklistListPage,
})
