import { createFileRoute } from '@tanstack/react-router'
import { MerchantReceivePage } from '@/modules/account/views/merchant-receive/MerchantReceivePage'

export const Route = createFileRoute('/_authenticated/account/merchant-receive')({
  component: MerchantReceivePage,
})
