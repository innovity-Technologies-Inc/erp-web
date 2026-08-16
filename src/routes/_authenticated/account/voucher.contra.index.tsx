import { createFileRoute } from '@tanstack/react-router'
import { ContraVoucherListPage } from '@/modules/account/views/contra-voucher/ContraVoucherListPage'

export const Route = createFileRoute('/_authenticated/account/voucher/contra/')({
  component: ContraVoucherListPage,
})
