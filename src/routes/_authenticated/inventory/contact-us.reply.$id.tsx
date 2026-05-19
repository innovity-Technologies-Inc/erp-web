import { createFileRoute } from '@tanstack/react-router'
import { ContactUsReplyPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/contact-us/reply/$id')({
  component: ContactUsReplyPage,
})
