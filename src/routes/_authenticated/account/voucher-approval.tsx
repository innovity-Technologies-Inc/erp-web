import { createFileRoute } from '@tanstack/react-router'
import { VoucherApprovalListPage } from '@/modules/account/views/voucher-approval/VoucherApprovalListPage'

export const Route = createFileRoute('/_authenticated/account/voucher-approval')({
  component: VoucherApprovalListPage,
})
