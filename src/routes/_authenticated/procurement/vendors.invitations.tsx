import { createFileRoute } from '@tanstack/react-router'
import { VendorInvitationListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/vendors/invitations')({
  component: VendorInvitationListPage,
})
