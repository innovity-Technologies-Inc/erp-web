import { createFileRoute } from '@tanstack/react-router'
import { JournalVoucherListPage } from '@/modules/account/views/journal-voucher/JournalVoucherListPage'

export const Route = createFileRoute('/_authenticated/account/voucher/journal/')({
  component: JournalVoucherListPage,
})
