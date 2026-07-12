import { createFileRoute } from '@tanstack/react-router'
import { ReceiptPaymentReportPage } from '@/modules/account/views/reports/ReceiptPaymentReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/receipt-payment')({
  component: ReceiptPaymentReportPage,
})
